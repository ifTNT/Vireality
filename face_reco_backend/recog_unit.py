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

# Packages for approximate nearest neighbor
from annoy import AnnoyIndex

def fetch_weight_from_mongodb(db):
    # Selection collection from database
    weight_collection = db['weight']

    bin_weight = weight_collection.find()

    if bin_weight.count(True)==0:
        raise "The weight is not in the MnogoDB. Please traing first."
    bin_weight = bin_weight[0]['model']

    logging.info("Weight loaded from MongoDB succesfully.")

    return pickle.loads(bin_weight)


def copy_weights(target, weights):
    for layer_target, weight in zip(target.layers, weights):
      layer_target.set_weights(weight)
    
    return target

def create_model_from_mongodb(db):
    base_model = create_base_network()

    # Fetch weights from MongoDB
    weights = fetch_weight_from_mongodb(db)

    # Copy weights to base model
    weighted_model = copy_weights(base_model, weights)

    return weighted_model

def construct_ann_from_mongodb(db):
    # Selection collection from database
    face_id_db_collection = db['face_id']

    # Prepare the mapping from ANN index to user_id
    # and the ANN instance.
    ann_map = {}
    ann = AnnoyIndex(EMBEDDING_SIZE(), 'euclidean')
    
    # Load all of the faces form MongoDB
    i=0
    for user in face_id_db_collection.find():
        ann_map[i] = user['user_id']
        ann.add_item(i, user['embedding'])
        i+=1
    del i

    logging.info("Loaded user_id and embeddings from MongoDB successfully.")
    logging.info("Constructing ANN searching trees.")

    # Construct the ANN searching tree
    # Fixed to 1024 trees.
    # [TODO] Adaptive tree number accroding to faces
    ann.build(1024)

    logging.info("ANN searching tree constructed.")

    return (ann_map, ann)



def face_recog_proc(sock, db, model, ann_map, ann):

    # Type should be RecogMsg
    work = zmq_serdes.recv_zipped_pickle(sock)
    
    logging.info('Received a work from recog-sched (req_id={})'.format(work.req_id))

    # Calculate embeddings from model
    embedding = model.predict(work.face_id)[0]
    logging.debug("Embedding calculated")

    # Perform ANN and send result to front-end-server
    # Perform ANN search. Get top 10 nearest neighbor.
    # If the following two condition is satisfied, return the user_id.
    # Otherwise, returns user not found.
    # Condition#1:
    #   There existed at least one neighbor that distance<=dist_thld.
    # Condition#2:
    #    The number of neighbors that satisfied cond#1 is greater than cnt_thld
    # If there existed mor than one lables satisfied the above two conditions,
    # return user not found.
    dist_thld = 0.6
    cnt_thld = 2
    ids, dists = ann.get_nns_by_vector(embedding, 20, include_distances=True)

    logging.info("Candidates")
    # Check which neighbors satisfied cond#1
    near_enough_neighbor = {}
    for id, dist in zip(ids, dists):
        user_id = ann_map[id]
        if dist <= dist_thld:
            print('User ID: {} {}'.format(user_id, dist))
            if user_id in near_enough_neighbor.keys():
                near_enough_neighbor[user_id] += 1
            else:
                near_enough_neighbor[user_id] = 1

    result_cnt = 0
    # If there is exately one person satisfied cond#1, output it.
    if len(near_enough_neighbor)==1:
        result_cnt = 1
        user_id_list = list(near_enough_neighbor.keys())
        result_user_id = user_id_list[0]
    else:
        # Check which neighbor satisfied cond#2
        result_user_id = -1
        for user_id in near_enough_neighbor:
            if near_enough_neighbor[user_id] > cnt_thld:
                result_cnt += 1
                result_user_id = user_id
    # If there are exately one lable satisfied the two conditions,
    # return it. Otherwise, return user not found.
    result_msg = {}
    if result_cnt == 1:
        result_msg = UserIDMsg(work.req_id, ResState.OK, result_user_id)
    else:
        result_msg = UserIDMsg(work.req_id, ResState.NOTFOUND, "")
    
    logging.info("Recognize result of req_id={} is {}, user_id={}".format(result_msg.req_id, result_msg.res_state, result_msg.user_id))

    return result_msg


def update_model_proc(sock, db, model):

    # Type of this should be DeployMsg
    notification = zmq_serdes.recv_zipped_pickle(sock)

    logging.info('Received model deploy notification from train-unit (serial={})'.format(notification.serial))

    # Fetch weights from MongoDB
    weights = fetch_weight_from_mongodb(db)

    # Copy weights to base model
    new_model = copy_weights(model, weights)

    # Construct the new ANN searching tree
    ann_map, ann = construct_ann_from_mongodb(db)
    
    return new_model, ann_map, ann

def main():
  LOG_FORMAT = '%(asctime)s [recog-unit]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  logging.info('I am a recog-unit')
  
  # Connection to MongoDB
  db_uri = "mongodb://localhost" 
  try: 
    db_client = MongoClient(db_uri)
    db_database = db_client['vireality_face_recog_backend']
    db_client.server_info()
    logging.info("Connected to database")
  except:
    logging.critical("Connect to database failed. Check if mongoDB alive.")

  # Create model
  embedding_model = create_model_from_mongodb(db_database)

  # Construct the ANN searching tree
  ann_map, ann = construct_ann_from_mongodb(db_database)

  context = zmq.Context()
  # Socket to receive work
  work_recv = context.socket(zmq.PULL)
  work_recv.connect(get_zmq_uri(RECOG_SCHED_IP(), RECOG_ISSUE_PORT()))
  # Socket to receive new model publication
  model_recv = context.socket(zmq.PULL)
  model_recv.connect(get_zmq_uri(TRAIN_IP(), TRAIN_PUBLISH_PORT()))
  # Socket to send result
  result_sender = context.socket(zmq.PUSH)
  result_sender.connect(get_zmq_uri(FRONT_IP(), FRONT_RECV_PORT()))

  # Register sockets to ZeroMQ event poller
  zmq_poller = zmq.Poller()
  zmq_poller.register(work_recv, zmq.POLLIN)
  zmq_poller.register(model_recv, zmq.POLLIN)

  logging.info('Begin receive works from recog-sched')

  # Polling on both socket.
  # If there are incoming messages, execute coresponsed procedure.
  while True:
    socks = dict(zmq_poller.poll(1000))
    if work_recv in socks and socks[work_recv] == zmq.POLLIN:
        result_msg = face_recog_proc(
            work_recv,
            db_database,
            embedding_model,
            ann_map,
            ann)
        zmq_serdes.send_zipped_pickle(result_sender, result_msg)
    if model_recv in socks and socks[model_recv] == zmq.POLLIN:
        embedding_model, ann_map, ann = update_model_proc(
            model_recv,
            db_database,
            embedding_model)

if __name__ == "__main__":
    main()