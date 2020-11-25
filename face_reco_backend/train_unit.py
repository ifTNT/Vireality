import time
import numpy as np
import os
from datetime import datetime
import copy
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'

import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *
from common.protocol.constant import *
import codecs, json 
import random
from pymongo import MongoClient
import pickle
from bson.binary import Binary
import threading

## for Model definition/training
from keras.models import Model, load_model
from keras.layers import Input, Flatten, Dense, concatenate,  Dropout, Lambda
from keras.optimizers import Adam

from keras.utils import plot_model
from keras.callbacks import ModelCheckpoint

## required for semi-hard triplet loss:
from tensorflow.python.ops import array_ops
from tensorflow.python.ops import math_ops
from tensorflow.python.framework import dtypes
from tensorflow.python.ops import nn

import tensorflow as tf

def pairwise_distance(feature, squared=False):
    """Computes the pairwise distance matrix with numerical stability.

    output[i, j] = || feature[i, :] - feature[j, :] ||_2

    Args:
      feature: 2-D Tensor of size [number of data, feature dimension].
      squared: Boolean, whether or not to square the pairwise distances.

    Returns:
      pairwise_distances: 2-D Tensor of size [number of data, number of data].
    """
    pairwise_distances_squared = math_ops.add(
        math_ops.reduce_sum(math_ops.square(feature), axis=[1], keepdims=True),
        math_ops.reduce_sum(
            math_ops.square(array_ops.transpose(feature)),
            axis=[0],
            keepdims=True)) - 2.0 * math_ops.matmul(feature,
                                                    array_ops.transpose(feature))

    # Deal with numerical inaccuracies. Set small negatives to zero.
    pairwise_distances_squared = math_ops.maximum(pairwise_distances_squared, 0.0)
    # Get the mask where the zero distances are at.
    error_mask = math_ops.less_equal(pairwise_distances_squared, 0.0)

    # Optionally take the sqrt.
    if squared:
        pairwise_distances = pairwise_distances_squared
    else:
        pairwise_distances = math_ops.sqrt(
            pairwise_distances_squared + math_ops.to_float(error_mask) * 1e-16)

    # Undo conditionally adding 1e-16.
    pairwise_distances = math_ops.multiply(
        pairwise_distances, math_ops.to_float(math_ops.logical_not(error_mask)))

    num_data = array_ops.shape(feature)[0]
    # Explicitly set diagonals to zero.
    mask_offdiagonals = array_ops.ones_like(pairwise_distances) - array_ops.diag(
        array_ops.ones([num_data]))
    pairwise_distances = math_ops.multiply(pairwise_distances, mask_offdiagonals)
    return pairwise_distances

def masked_maximum(data, mask, dim=1):
    """Computes the axis wise maximum over chosen elements.

    Args:
      data: 2-D float `Tensor` of size [n, m].
      mask: 2-D Boolean `Tensor` of size [n, m].
      dim: The dimension over which to compute the maximum.

    Returns:
      masked_maximums: N-D `Tensor`.
        The maximized dimension is of size 1 after the operation.
    """
    axis_minimums = math_ops.reduce_min(data, dim, keepdims=True)
    masked_maximums = math_ops.reduce_max(
        math_ops.multiply(data - axis_minimums, mask), dim,
        keepdims=True) + axis_minimums
    return masked_maximums

def masked_minimum(data, mask, dim=1):
    """Computes the axis wise minimum over chosen elements.

    Args:
      data: 2-D float `Tensor` of size [n, m].
      mask: 2-D Boolean `Tensor` of size [n, m].
      dim: The dimension over which to compute the minimum.

    Returns:
      masked_minimums: N-D `Tensor`.
        The minimized dimension is of size 1 after the operation.
    """
    axis_maximums = math_ops.reduce_max(data, dim, keepdims=True)
    masked_minimums = math_ops.reduce_min(
        math_ops.multiply(data - axis_maximums, mask), dim,
        keepdims=True) + axis_maximums
    return masked_minimums

def triplet_loss_adapted_from_tf(y_true, y_pred):
    # The y_true value is dummy and useless
    del y_true
    margin = 1.

    # The label of embeddings
    labels = y_pred[:, :1]
    labels = tf.cast(labels, dtype='int32')

    # The embeddings
    embeddings = y_pred[:, 1:]

    ### Code from Tensorflow function [tf.contrib.losses.metric_learning.triplet_semihard_loss] starts here:
    
    # Reshape [batch_size] label tensor to a [batch_size, 1] label tensor.
    # lshape=array_ops.shape(labels)
    # assert lshape.shape == 1
    # labels = array_ops.reshape(labels, [lshape[0], 1])

    # Build pairwise squared distance matrix.
    pdist_matrix = pairwise_distance(embeddings, squared=True)
    # Build pairwise binary adjacency matrix.
    adjacency = math_ops.equal(labels, array_ops.transpose(labels))
    # Invert so we can select negatives only.
    adjacency_not = math_ops.logical_not(adjacency)

    # global batch_size  
    batch_size = array_ops.size(labels) # was 'array_ops.size(labels)'

    # Compute the mask.
    pdist_matrix_tile = array_ops.tile(pdist_matrix, [batch_size, 1])
    mask = math_ops.logical_and(
        array_ops.tile(adjacency_not, [batch_size, 1]),
        math_ops.greater(
            pdist_matrix_tile, array_ops.reshape(
                array_ops.transpose(pdist_matrix), [-1, 1])))
    mask_final = array_ops.reshape(
        math_ops.greater(
            math_ops.reduce_sum(
                math_ops.cast(mask, dtype=dtypes.float32), 1, keepdims=True),
            0.0), [batch_size, batch_size])
    mask_final = array_ops.transpose(mask_final)

    adjacency_not = math_ops.cast(adjacency_not, dtype=dtypes.float32)
    mask = math_ops.cast(mask, dtype=dtypes.float32)

    # negatives_outside: smallest D_an where D_an > D_ap.
    negatives_outside = array_ops.reshape(
        masked_minimum(pdist_matrix_tile, mask), [batch_size, batch_size])
    negatives_outside = array_ops.transpose(negatives_outside)

    # negatives_inside: largest D_an.
    negatives_inside = array_ops.tile(
        masked_maximum(pdist_matrix, adjacency_not), [1, batch_size])
    semi_hard_negatives = array_ops.where(
        mask_final, negatives_outside, negatives_inside)

    loss_mat = math_ops.add(margin, pdist_matrix - semi_hard_negatives)

    mask_positives = math_ops.cast(
        adjacency, dtype=dtypes.float32) - array_ops.diag(
        array_ops.ones([batch_size]))

    # In lifted-struct, the authors multiply 0.5 for upper triangular
    #   in semihard, they take all positive pairs except the diagonal.
    num_positives = math_ops.reduce_sum(mask_positives)

    semi_hard_triplet_loss_distance = math_ops.truediv(
        math_ops.reduce_sum(
            math_ops.maximum(
                math_ops.multiply(loss_mat, mask_positives), 0.0)),
        num_positives,
        name='triplet_semihard_loss')
    
    ### Code from Tensorflow function semi-hard triplet loss ENDS here.
    return semi_hard_triplet_loss_distance

def create_base_network(image_input_shape, embedding_size):
    """
    Base network to be shared (eq. to feature extraction).
    """
    input_image = Input(shape=image_input_shape)

    #x = Flatten()(input_image)
    x = Dropout(0.1)(input_image)
    x = Dense(512, activation='sigmoid')(x)
    x = Dropout(0.1)(x)
    x = Dense(embedding_size)(x)
    x = Lambda(lambda x :nn.l2_normalize(x, axis=1, epsilon=1e-10))(x)

    base_network = Model(inputs=input_image, outputs=x)

    return base_network

# Use given list of features and user_ids to train a new model
# Returns the new model and the calculated embeddings
def train_main(features, user_ids):
    # Ensure the type of feature.
    features = np.array(features,dtype='float32')

    # Convert user_id to integer in order to train neural network
    y_data_cnt = 0
    user_id_map = {}
    y_data = []
    for user_id in user_ids:
        if user_id in user_id_map:
            y_data.append(user_id_map[user_id])
        else:
            y_data.append(y_data_cnt)
            user_id_map[user_id] = y_data_cnt
            y_data_cnt+=1
    del y_data_cnt
    del user_id_map

    # Prepared dataset for training and vaildation
    y_data = np.array(y_data)
    x_data = copy.deepcopy(features)
    print(x_data.shape, y_data.shape)

    # Prepare the space of training set and vaildation set
    x_train = []
    y_train = []
    x_val = []
    y_val = []

    # Counting how many samples in training set and initialize it.
    cnt_train = {}
    for y in y_data:
        cnt_train[y] = 0
    
    # Partition the data into training set and vaildation set
    # Randomly assign 8 samples of data to training set.
    # Assign rest of data to vaildation set.
    for x,y in zip(x_data, y_data):
        # If there is no space left in training set,
        # put into the vaildation set
        if cnt_train[y]==8:
            x_val.append(x)
            y_val.append(y)
        else:
            # Flip the coin. Assigne to random data set.
            # If assigned to training set, increase the counter.
            if random.randint(0, 1)==0:
                x_train.append(x)
                y_train.append(y)
                cnt_train[y] += 1
            else:
                x_val.append(x)
                y_val.append(y)

    # x_test = []
    # x_test = np.array(x_test)
    # path_xTrain = copy.deepcopy(x_train)
    # x_train = np.array([],dtype=x_train.dtype)
    # for i in range(int(len(path_xTrain)/10)):
    #     np.random.shuffle(path_xTrain[i * 10 : (i + 1) * 10])
    #     x_test = np.append(x_test, path_xTrain[i * 10 + 8 : (i + 1) * 10])
    #     x_train = np.append(x_train, path_xTrain[i * 10 : (i + 1) * 10 -2])
    # x_train = np.reshape(x_train,(len(x_train)// 1792, 1, 1792))
    # x_test = np.reshape(x_test,(len(x_test)// 1792, 1, 1792))

    # y_test = []
    # input_image_shape = 
    # x_val = x_test
    # y_val = []
    # for i in y_train:
    #     for j in range(8):
    #         y_test.append(i)
    #     for j in range(2):
    #         y_val.append(i)
    # y_test = np.array(y_test)
    # y_val = np.array(y_val)

    # Convert the training set and vaildation set to numpy array.
    # So that we can feed them into keras.
    x_train = np.array(x_train)
    y_train = np.array(y_train)
    x_val = np.array(x_val)
    y_val = np.array(y_val)

    print(x_train.shape, y_train.shape, x_val.shape, y_val.shape)

    # The constants of training and the neural network
    batch_size = 256
    epochs = 30
    embedding_size = 64

    # Define the architecture of training neural network
    base_network = create_base_network(NN_INPUT_SHAPE(), embedding_size)
    # input layer for images
    input_faceId = Input(shape=NN_INPUT_SHAPE(), name='input_faceId')
     # input layer for labels
    input_labels = Input(shape=(1,), name='input_label')
    # output of network -> embeddings
    embeddings = base_network([input_faceId])               
    # concatenating the labels + embeddings
    labels_plus_embeddings = concatenate([input_labels, embeddings])
    # Defining a model with inputs (images, labels) and outputs (labels_plus_embeddings)
    model = Model(inputs=[input_faceId, input_labels],
                    outputs=labels_plus_embeddings)
    # Output the architecture of training model
    model.summary()

    # The optimiser. RMS is good too!
    opt = Adam(lr=0.001)
    # Construct the training model withe custom triplet loss function
    model.compile(loss=triplet_loss_adapted_from_tf, optimizer=opt)

    # Uses 'dummy' embeddings + dummy gt labels. Will be removed as soon as loaded, to free memory
    dummy_gt_train = np.zeros((len(x_train), embedding_size + 1))
    dummy_gt_val = np.zeros((len(x_val), embedding_size + 1))
    
    # Train the model.
    # It's noticeable that x_train and y_train are both feed into x.
    # The reason is that triplet-loss need the distance between training labels,
    # not distatnce between predicted label and true label.
    H = model.fit(
        x=[x_train,y_train],
        y=dummy_gt_train,
        batch_size=batch_size,
        epochs=epochs,
        validation_data=([x_val, y_val], dummy_gt_val))

    # Remove the dummy data to save the memory
    del dummy_gt_train
    del dummy_gt_val

    # creating an empty network
    testing_model = create_base_network(NN_INPUT_SHAPE(), embedding_size)

    # Grabbing the weights from the trained network
    for layer_target, layer_source in zip(testing_model.layers, model.layers[2].layers):
        weights = layer_source.get_weights()
        layer_target.set_weights(weights)
        del weights

    print("Training is done")
    return testing_model

def gen_user_id_embs(model, features, user_ids):
    # Ensure the shape of input features
    if features.shape[1] != FEATURE_SIZE():
        logging.error(
            "Shape mismatch {} != (*,{})".format(
                features.shape,
                FEATURE_SIZE()
            )
        )
        return []

    embeddings = model.predict(features)

    # Group all of the data to database
    grouped_db = zip(user_ids, embeddings)

    return grouped_db

def addTrainSampleToMongoDB(db, user_id, features):
    # Select the collection from db
    train_collection = db['train']

    # Construct the new training data by flatten the training requests
    new_train_data = [
        {
            'user_id': user_id,
            'feature': feature.tolist()
        } for feature in features
    ]

    # Save to MongoDB
    train_collection.insert_many(new_train_data)

def fetchTrainSampleFromMongo(db):
    # Select the collection from db
    train_collection = db['train']

    # The value that stored the faceID and the label
    x_faceId = []
    y_label = []

    # Enumerate all of the faces
    for sample in train_collection.find():
        y_label.append(sample['user_id'])
        x_faceId.append(sample['feature'])

    # Convert to numpy array
    x_faceId = np.array(x_faceId)
    y_label = np.array(y_label)

    return (x_faceId, y_label)

def saveWeightToMongoDB(db, weight):
    # Select the collection from db
    weight_collection = db['weight']

    # Serialized weight
    bin_weight = Binary(pickle.dumps(weight))

    # Remove the old weights and insert new weights
    weight_collection.drop()
    weight_collection.insert({'model': bin_weight})

def saveEmbeddingToMongoDB(db, new_database):
    # Select the collection from db
    embedding_collection = db['face_id']

    # Remove the old datas.
    # Due to all of the data will be modified when training new model. 
    embedding_collection.drop()

    new_documents = [{
            'user_id': user_id,
            'embedding': embedding.tolist()
        } for user_id, embedding in new_database]

    # Save to MongoDB
    embedding_collection.insert_many(new_documents)

# The mutex to protect database between feature receiver and trainer
mutex = threading.Lock()

# This flag is also shared between feature receiver and trainer.
# Since assignment of boolean in python is threadsafe,
# no additional mutex is needed.
need_train = False

# The thread to receive result from socket
class FeatureReceiver(threading.Thread):
    def __init__(self, socket, db):
        threading.Thread.__init__(self)
        self.socket = socket
        self.db = db

    def run(self):
        global mutex
        global need_train

        logging.info('Begin receive feature from recog-sched')
        while True:
            work = zmq_serdes.recv_zipped_pickle(self.socket)
            logging.info('Received a work from recog-sched (label={})'.format(work.label))

            # Critical Section (database)
            mutex.acquire()
            addTrainSampleToMongoDB(self.db, work.label, work.face_id)
            need_train = True
            mutex.release()

def main():
  global mutex
  global need_train
  LOG_FORMAT = '%(asctime)s [train-unit]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  logging.info('I am a train-unit')
  
  # Connection to MongoDB
  db_uri = "mongodb://localhost" 
  try: 
    db_client = MongoClient(db_uri)
    db_database = db_client['vireality_face_recog_backend']
    db_client.server_info()
    logging.info("Connected to database")
  except:
    logging.critical("Connect to database failed. Check if mongoDB alive.")

  context = zmq.Context()
  # Socket to receive work
  work_recv = context.socket(zmq.PULL)
  work_recv.connect(get_zmq_uri(RECOG_SCHED_IP(), TRAIN_ISSUE_PORT()))
  # Socket to publish training notification
  result_sender = context.socket(zmq.PUSH)
  result_sender.bind(get_zmq_uri(TRAIN_IP(), TRAIN_PUBLISH_PORT()))

  # Start result receiver thread
  feature_recv_thread = FeatureReceiver(work_recv, db_database)
  feature_recv_thread.start()

  while True:
    # If there is no training job, goto sleep and check later.
    if(not need_train):
        time.sleep(1)
        continue
    
    logging.info('Begin training')

    # Critical section: Read faceID DB from MongoDB.
    mutex.acquire()
    need_train = False
    x_faceId, y_label = fetchTrainSampleFromMongo(db_database)
    mutex.release()

    # Training new model with incoming faces.
    new_model = train_main(x_faceId, y_label)
    new_user_id_embs = gen_user_id_embs(new_model, x_faceId, y_label)

    # Extract the weights and biases form new-trained model.
    # Only extract the weight of fully connected layer.
    output_weight = []
    for i in new_model.layers:
        output_weight.append(i.get_weights())

    # Save weights and embeddings to MongoDB.
    saveWeightToMongoDB(db_database, output_weight)
    saveEmbeddingToMongoDB(db_database, new_user_id_embs)

    # Issue deploy message to recog-units
    deploy_msg = DeployModelMsg(int(datetime.now().timestamp()*1000))
    zmq_serdes.send_zipped_pickle(result_sender, deploy_msg)
    logging.info("Published model deploing message with serial={}.".format(deploy_msg.serial))
  
  # Wait the children thread to be done
  feature_recv_thread.join()

if __name__ == "__main__":
    main()