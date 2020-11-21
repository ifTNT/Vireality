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
    del y_true
    margin = 1.
    labels = y_pred[:, :1]

 
    labels = tf.cast(labels, dtype='int32')

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

    x = Flatten()(input_image)
    x = Dropout(0.1)(x)
    x = Dense(512, activation='sigmoid')(x)
    x = Dropout(0.1)(x)
    x = Dense(embedding_size)(x)
    x = Lambda(lambda x :nn.l2_normalize(x, axis=1, epsilon=1e-10))(x)

    base_network = Model(inputs=input_image, outputs=x)

    return base_network

# if __name__ == "__main__":
def train_main(x_train, y_train):
    # in case this scriot is called from another file, let's make sure it doesn't start training the network...
    x_train = np.reshape(x_train,(len(x_train)//1792, 1, 1792))
    x_train = np.array(x_train,dtype='float32')
    user_id = copy.deepcopy(y_train)
    y_train = np.array([i for i in range(len(y_train))])
    
    x_train_all = copy.deepcopy(x_train)

    batch_size = 256
    epochs = 25

    embedding_size = 64

    step = 10

    x_test = []
    x_test = np.array(x_test)
    path_xTrain = copy.deepcopy(x_train)
    x_train = np.array([],dtype=x_train.dtype)
    for i in range(int(len(path_xTrain)/10)):
        np.random.shuffle(path_xTrain[i * 10 : (i + 1) * 10])
        x_test = np.append(x_test, path_xTrain[i * 10 + 8 : (i + 1) * 10])
        x_train = np.append(x_train, path_xTrain[i * 10 : (i + 1) * 10 -2])
    x_train = np.reshape(x_train,(len(x_train)// 1792, 1, 1792))
    x_test = np.reshape(x_test,(len(x_test)// 1792, 1, 1792))

    y_test = []
    input_image_shape = FEATURE_SHAPE()
    x_val = x_test
    y_val = []
    for i in y_train:
        for j in range(8):
            y_test.append(i)
        for j in range(2):
            y_val.append(i)
    y_test = np.array(y_test)
    y_val = np.array(y_val)

    # Network training...
    base_network = create_base_network(input_image_shape, embedding_size)

    input_faceId = Input(shape=input_image_shape, name='input_faceId') # input layer for images
    input_labels = Input(shape=(1,), name='input_label')    # input layer for labels
    embeddings = base_network([input_faceId])               # output of network -> embeddings
    labels_plus_embeddings = concatenate([input_labels, embeddings])  # concatenating the labels + embeddings

    # Defining a model with inputs (images, labels) and outputs (labels_plus_embeddings)
    model = Model(inputs=[input_faceId, input_labels],
                    outputs=labels_plus_embeddings)

    model.summary()
    # train session
    opt = Adam(lr=0.001)  # choose optimiser. RMS is good too!

    model.compile(loss=triplet_loss_adapted_from_tf, optimizer=opt)

    # Uses 'dummy' embeddings + dummy gt labels. Will be removed as soon as loaded, to free memory
    dummy_gt_train = np.zeros((len(x_train), embedding_size + 1))
    dummy_gt_val = np.zeros((len(x_val), embedding_size + 1))
    
    H = model.fit(
        x=[x_train,y_test],
        y=dummy_gt_train,
        batch_size=batch_size,
        epochs=epochs,
        validation_data=([x_val, y_val], dummy_gt_val))

    # creating an empty network
    testing_embeddings = create_base_network(input_image_shape, embedding_size=embedding_size)
    # Grabbing the weights from the trained network
    for layer_target, layer_source in zip(testing_embeddings.layers, model.layers[2].layers):
        weights = layer_source.get_weights()
        layer_target.set_weights(weights)
        del weights

    x_embeddings = testing_embeddings.predict(np.reshape(x_train_all, (len(x_train_all), 1, 1792)))

    # Group 10 samples of x_train together
    num_x = x_train_all.shape[0]//10
    reshaped_feature = np.reshape(x_train_all,(num_x, 10, 1792))

    # Label: the index of y_train
    user_label = range(len(y_train))

    # Group 10 samples of x_embeddings together
    num_x = x_embeddings.shape[0]//10
    reshaped_embs = np.reshape(x_embeddings,(num_x, 10, 64))

    # Write the database to file
    grouped_db = zip(user_id, reshaped_feature, user_label, reshaped_embs)

    print("done train")
    return (model, grouped_db)

class NumPyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return super(MyEncoder, self).default(obj)

def readUseridTable(face_id, label, file_path):
    x_faceId = []
    y_label = []
    x_faceId = np.array(x_faceId)
    y_label = np.array(y_label)
    try:
        obj_text = codecs.open(file_path, 'r', encoding='utf-8').read()
        userIdFeatureTable = np.array(json.loads(obj_text))        
        for index in userIdFeatureTable:
            y_label = np.append(y_label,index['user_id'])
            x_faceId = np.append(x_faceId,index['faceId'])
        x_faceId = x_faceId.reshape(int(x_faceId.size / 17920),10,1792)    
    except Exception:
        print("read file filed")
    
    x_faceId = np.append(x_faceId,face_id.reshape(10,1792))
    y_label = np.append(y_label,label)
    
    return (x_faceId, y_label)

def fetchTrainingFaceFromMongo(db):
    # Select the collection from db
    face_id_collection = db['face_id']

    # The value that stored the faceID and the label
    x_faceId = []
    y_label = []

    # Enumerate all of the faces
    for faces in face_id_collection.find():
        y_label = np.append(y_label,faces['user_id'])
        x_faceId = np.append(x_faceId,faces['feature'])

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

def saveFaceIdDatabaseToMongoDB(db, new_database):
    # Select the collection from db
    face_id_collection = db['face_id']

    # Remove the old datas.
    # Due to all of the data will be modified when training new model. 
    face_id_collection.drop()

    new_documents = []
    for user_id, x, label, embedding in new_database:
        new_documents.append({
            'user_id': user_id,
            'feature': x.tolist(),
            'label': label,
            'embedding': embedding.tolist()
        })

    # Save to MongoDB
    face_id_collection.insert_many(new_documents)

def saveAnnToMongoDB(db):
    pass

def main():
  LOG_FORMAT = '%(asctime)s [train-unit]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  logging.info('I am a train-unit')
  
  # Connection to MongoDB
  db_uri = "mongodb://localhost" 
  try: 
    db_client = MongoClient(db_uri)
    db_database = db_client['vireality_face_recog_backend']
    logging.info("Connected to database")
    logging.debug(db_client.server_info())
  except:
    logging.critical("Connect to database failed. Check if mongoDB alive.")

  context = zmq.Context()
  # Socket to recieve work
  work_recv = context.socket(zmq.PULL)
  work_recv.connect(get_zmq_uri(RECOG_SCHED_IP(), TRAIN_ISSUE_PORT()))
  # Socket to send result
  result_sender = context.socket(zmq.PUSH)
  result_sender.bind(get_zmq_uri(TRAIN_IP(), TRAIN_PUBLISH_PORT()))

  logging.info('Begin receive works from recog-sched')

  while True:
    work = zmq_serdes.recv_zipped_pickle(work_recv)
    
    logging.info('Received a work from recog-sched (label={})'.format(work.label))

    # Read faceID DB from MongoDB.
    x_faceId, y_label = fetchTrainingFaceFromMongo(db_database)
    x_faceId = np.append(x_faceId, work.face_id)
    y_label = np.append(y_label, work.label)
    # Training new model with incoming faces.
    # Write the user-id, raw feature and embeddings to face_db_file
    #face_db_path = './models/faceDB.json'
    #x_faceId, y_label = readUseridTable(work.face_id, work.label, face_db_path)
    outPutModel, new_database = train_main(x_faceId, y_label)

    # Extract the weights and biases form new-trained model.
    # Only extract the weight of fully connected layer.
    outPutWeight = []
    # for i in outPutModel.layers:
    #     outPutWeight.append(i.get_weights())
    #     print(len(i.get_weights()))
    outPutWeight.append(outPutModel.layers[2].get_weights())

    # Calculate Approximate Nearest Neighbors.
    # And save to file.

    # [TODO] Save weights, faceID DB, ANN to MongoDB.
    saveWeightToMongoDB(db_database, outPutWeight)
    saveFaceIdDatabaseToMongoDB(db_database, new_database)
    saveAnnToMongoDB(db_database)

    # Issue deploy message to recog-units
    deploy_msg = DeployModelMsg(int(datetime.now().timestamp()*1000))
    #zmq_serdes.send_zipped_pickle(result_sender, deploy_msg)

if __name__ == "__main__":
    main()