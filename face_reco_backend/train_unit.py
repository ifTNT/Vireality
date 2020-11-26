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
from common.neural_network import create_base_network
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
from libs.PSOkeras.psokeras import Optimizer as PSOptimizer

from keras.utils import plot_model
from keras.callbacks import ModelCheckpoint
import matplotlib.pyplot as plt
mpl_logger = logging.getLogger('matplotlib')
mpl_logger.setLevel(logging.WARNING) 

from libs.triplet_loss import triplet_loss_adapted_from_tf

# Unison shuffle two munpy array
def unison_shuffled_copies(a, b):
    assert len(a) == len(b)
    p = np.random.permutation(len(a))
    return a[p], b[p]

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
    
    # Shuffle the dataset
    x_data, y_data = unison_shuffled_copies(x_data, y_data)

    # Prepare the space of training set and vaildation set
    x_train = []
    y_train = []
    x_val = []
    y_val = []

    # Counter of samples in training data. Initialize to zero.
    train_cnt = {}
    for i in y_data:
        train_cnt[i] = 0
    
    # Partition the data into training set and vaildation set
    # Assign first 8 shuffled samples to training data. 
    # Assign rest of data to vaildation set.
    for x,y in zip(x_data, y_data):
        if train_cnt[y] < 8:
            x_train.append(x)
            y_train.append(y)
            train_cnt[y] += 1
        else:
            x_val.append(x)
            y_val.append(y)

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
    learning_rate = 0.01
    embedding_size = EMBEDDING_SIZE()
    use_pso = False

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

    # Uses 'dummy' embeddings + dummy gt labels. Will be removed as soon as loaded, to free memory
    dummy_gt_train = np.zeros((len(x_train), embedding_size + 1))
    dummy_gt_val = np.zeros((len(x_val), embedding_size + 1))
    
    logging.info("Begin trainiing")
    if use_pso:
        # [TODO] Use modidied PSO
        # Instantiate optimizer with model, loss function, and hyperparameters
        pso = PSOptimizer(
            model=model,
            loss=triplet_loss_adapted_from_tf,
            n=30,  # Number of particles
            acceleration=1.0,  # Contribution of recursive particle velocity (acceleration)
            local_rate=0.6,    # Contribution of locally best weights to new velocity
            global_rate=0.4   # Contribution of globally best weights to new velocity
        )
        # Train model on provided data
        pso.fit(
            [x_train, y_train],
            dummy_gt_train,
            steps=20,
            batch_size=batch_size
        )

        # Get a copy of the model with the globally best weights
        model = pso.get_best_model()

        # Display the loss of selected model
        train_loss = model.evaluate(
            [x_train, y_train],
            dummy_gt_train,
            batch_size=batch_size,
            verbose=0
        )
        val_loss = model.evaluate(
            [x_val, y_val],
            dummy_gt_val,
            batch_size=batch_size,
            verbose=0
        )
        logging.info(
            "Model loss with PSO -- train: {:.4f}  test: {:.4f}".format(train_loss, val_loss)
        )
    else:
        # The optimiser. RMS is good too!
        opt = Adam(lr=learning_rate)
        # Construct the training model withe custom triplet loss function
        model.compile(loss=triplet_loss_adapted_from_tf, optimizer=opt)

        # Train the model.
        # It's noticeable that x_train and y_train are both feed into x.
        # The reason is that triplet-loss need the distance between training labels,
        # not distatnce between predicted label and true label.
        history = model.fit(
            x=[x_train,y_train],
            y=dummy_gt_train,
            batch_size=batch_size,
            epochs=epochs,
            validation_data=([x_val, y_val], dummy_gt_val))

        # Remove the dummy data to save the memory
        del dummy_gt_train
        del dummy_gt_val

        # Training history visualization
        plt.plot(history.history['loss'])
        plt.plot(history.history['val_loss'])
        plt.title('Model loss (lr={}, n_train={}, n_val={})'.format(
            learning_rate,
            x_train.shape[0],
            x_val.shape[0]
        ))
        plt.grid(True)
        plt.ylabel('Loss')
        plt.xlabel('Epoch')
        fig = plt.gcf()
        fig.set_size_inches(20, 10)
        axes = plt.gca()
        axes.set_ylim([0, 1])
        plt.xticks([i for i in range(epochs)])
        plt.legend(['Train', 'Val'], loc='upper left')
        # Save history to file
        plt.savefig('train_history/{}.png'.format(
            int(datetime.now().timestamp()*1000)
        ))
        plt.close('all')

    # creating an empty network
    testing_model = create_base_network(NN_INPUT_SHAPE(), embedding_size)

    # Grabbing the weights from the trained network
    for layer_target, layer_source in zip(testing_model.layers, model.layers[2].layers):
        weights = layer_source.get_weights()
        layer_target.set_weights(weights)
        del weights

    logging.info("Training is done")
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
need_train = True

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