import time
import numpy as np
import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'

from keras.models import load_model
from keras.models import Model
import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *

def create_base_network(image_input_shape, embedding_size):
    input_image = Input(shape=image_input_shape)

    x = Dropout(0.1)(input_image)
    x = Dense(128, activation='sigmoid')(x)
    x = Dropout(0.1)(x)
    x = Dense(128, activation='sigmoid')(x)
    x = Dropout(0.1)(x)
    x = Dense(embedding_size)(x)

    base_network = Model(inputs=input_image, outputs=x)
    return base_network

def tipletLoss(input_image_shape, embedding_size):
    base_network = create_base_network(input_image_shape, embedding_size)
    input_images = Input(shape=input_image_shape, name='input_image') # input layer for images
    input_labels = Input(shape=(1,), name='input_label')    # input layer for labels
    embeddings = base_network([input_images])               # output of network -> embeddings
    labels_plus_embeddings = concatenate([input_labels, embeddings])  # concatenating the labels + embeddings

    # Defining a model with inputs (images, labels) and outputs (labels_plus_embeddings)
    model = Model(inputs=[input_images, input_labels], outputs=labels_plus_embeddings)
    model.summary()



def main():
  LOG_FORMAT = '%(asctime)s [train-unit]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  logging.info('I am a train-unit')
  
  context = zmq.Context()
  # Socket to recieve work
  work_recv = context.socket(zmq.PULL)
  work_recv.connect(get_zmq_uri(RECOG_SHED_IP(), TRAIN_ISSUE_PORT()))
  # Socket to send result
  result_sender = context.socket(zmq.PUSH)
  result_sender.listen(get_zmq_uri(TRAIN_IP(), TRAIN_PUBLISH_PORT()))

  logging.info('Begin receive works from recog-sched')

  while True:
    work = zmq_serdes.recv_zipped_pickle(work_recv)
    
    logging.info('Received a work from recog-sched (req_id={})'.format(work.req_id))
    
    if(work.req_type!=ReqType.NEW):
      """If image size dosen't match, reject it."""
    #   result = FeatureMsg(work.req_id, work.req_type, ResState.REJECT, "")
        continue
    else:
      """Recognize the face"""
    #   face_id = facenet.calc_embs(work.img)

        result = DeployModelMsg(unix_time_stamp, outPutModel)

    zmq_serdes.send_zipped_pickle(result_sender, result)

if __name__ == "__main__":
    main()