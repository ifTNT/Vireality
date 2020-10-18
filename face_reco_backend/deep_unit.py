"""
facenet.py
The main script of facenet-unit of face recognition backend.
"""

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
    embedding = self.__l2_normalize(embedding)

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
  LOG_FORMAT = '%(asctime)s [facenet-unit]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  img_size = 160
  expected_img_shape = (img_size, img_size, 3)
  model_path = 'models/Inception_ResNet_v1_MS_Celeb_1M.h5'
  logging.info('I am a facenet-unit')
  facenet = Facenet(model_path, img_size)
  
  context = zmq.Context()
  # Socket to recieve work
  work_recv = context.socket(zmq.PULL)
  work_recv.connect(get_zmq_uri(FRONT_IP(), FRONT_ISSUE_PORT()))
  # Socket to send result
  result_sender = context.socket(zmq.PUSH)
  result_sender.connect(get_zmq_uri(RECOG_SHED_IP(), RECOG_SCHED_RECV_PORT()))

  logging.info('Begin receive works from front-end-server')

  while True:
    work = zmq_serdes.recv_zipped_pickle(work_recv)
    
    logging.info('Received a work from front-end-server (req_id={})'.format(work.req_id))
    
    if(work.img.shape!=expected_img_shape):
      """If image size dosen't match, reject it."""
      result = FeatureMsg(work.req_id, work.req_type, ResState.REJECT, "")
    else:
      """Recognize the face"""
      face_id = facenet.calc_embs(work.img)
      result = FeatureMsg(work.req_id, work.req_type, ResState.OK, face_id)

    zmq_serdes.send_zipped_pickle(result_sender, result)

if __name__ == "__main__":
    main()