"""
facenet.py
The main script of deep-unit of face recognition backend.
"""

import time
import sys
import numpy as np
# Prevent array truncation while printing nparray
np.set_printoptions(threshold=sys.maxsize)
import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'

from keras.models import load_model
from keras.models import Model
import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *
from common.protocol.constant import DEEP_INPUT_SHAPE, FEATURE_SHAPE

class Facenet():
  def __init__(self, inception_resnet_v1_path, img_size):
    self.img_size = img_size

    logging.info(f'Loading facenet model...')
    start = time.time()
    model_path = os.path.abspath(inception_resnet_v1_path)
    inception_resnet_v1 = load_model(model_path, compile=False)

    # Remove the dropout layer, full-connected layer
    # and the batch-normalizing layer
    # from the original Inception ResNet-V1 model.
    new_input_layer = inception_resnet_v1.input
    new_output_layer = inception_resnet_v1.layers[-4].output
    self.model = Model(new_input_layer, new_output_layer)
    last = time.time()

    logging.info(f'Loaded facenet model : {model_path}')
    self.model.summary()
    logging.info(f'Time spent on loading model: {(last-start)} seconds')

  # Input an aligned image.
  # Output the embedding of the image
  def calc_embs(self, img):
    preprocessed_img = self.__prewhiten(img)
    embedding = self.model.predict_on_batch(preprocessed_img)
    #embedding = self.__l2_normalize(embedding)

    return embedding

  # Normalize the picture in preprocessing stage
  def __prewhiten(self, x):
    if x.ndim == 4:
        axis = (1, 2, 3)
        size = x[0].size
    elif x.ndim == 3:
        axis = (0, 1, 2)
        size = x.size
    else:
        raise ValueError('Dimension should be 3 or 4')

    mean = np.mean(x, axis=axis, keepdims=True)
    std = np.std(x, axis=axis, keepdims=True)
    std_adj = np.maximum(std, 1.0/np.sqrt(size))
    y = (x - mean) / std_adj
    return y

  # L2 normalize to produce embeddings
  def __l2_normalize(self, x, epsilon=1e-10):
    output = x / np.sqrt(np.maximum(np.sum(np.square(x), keepdims=True), epsilon))
    return output

def main():
  LOG_FORMAT = '%(asctime)s [deep-unit]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  model_path = 'models/Inception_ResNet_v1_MS_Celeb_1M.h5'
  logging.info('I am a deep-unit')
  facenet = Facenet(model_path, DEEP_INPUT_SHAPE()[1])
  
  context = zmq.Context()
  # Socket to receive work
  work_recv = context.socket(zmq.PULL)
  work_recv.connect(get_zmq_uri(FRONT_IP(), FRONT_ISSUE_PORT()))
  # Socket to send result
  result_sender = context.socket(zmq.PUSH)
  result_sender.connect(get_zmq_uri(RECOG_SCHED_IP(), RECOG_SCHED_RECV_PORT()))

  logging.info('Begin receive works from front-end-server')

  while True:
    work = zmq_serdes.recv_zipped_pickle(work_recv)
    
    logging.info('Received a work from front-end-server (req_id={})'.format(work.req_id))
    
    if(work.img.shape!=DEEP_INPUT_SHAPE()):
      #If image size dosen't match, reject it.
      logging.info('[req_id={}] Image size mismatch, rejected. Image size={}'.format(work.req_id, work.img.shape))
      result = FeatureMsg(work.req_id, work.req_type, ResState.REJECT, "", "")
    else:
      #Recognize the face
      face_id = facenet.calc_embs(work.img)
      result = FeatureMsg(work.req_id, work.req_type, ResState.OK, face_id, work.label)
      logging.info('[req_id={}] Feature caculated!. Shape of feature = {}'.format(work.req_id, result.face_id.shape))
      #logging.debug('Feature: \n{}'.format(result.face_id))

    zmq_serdes.send_zipped_pickle(result_sender, result)

if __name__ == "__main__":
    main()