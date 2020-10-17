"""
facenet.py
The main script of facenet-unit of face recognition backend.
"""

import time
import numpy as np
import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'

import cv2
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
from imageio import imread
from skimage.transform import resize
from keras.models import load_model
from joblib import dump, load
import xgboost as xgb
from xgboost import XGBClassifier
import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *
import zlib
import io

class Facenet():
  def __init__(self, model_path, img_size):
    self.model_path = model_path
    self.img_size = img_size


    logging.info(f'Loading facenet model...')
    start = time.time()
    model_path = os.path.abspath(model_path)
    self.model = load_model(model_path, compile=False)
    last = time.time()

    logging.info(f'Loaded facenet model : {self.model_path}')
    logging.info(f'Time spent on loading model: {(last-start)} seconds')

  # Input an aligned image.
  # Output the embedding of the image
  def calc_embs(self, img, margin=10, batch_size=1):
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
  def __l2_normalize(self, x, axis=-1, epsilon=1e-10):
    output = x / np.sqrt(np.maximum(np.sum(np.square(x), axis=axis, keepdims=True), epsilon))
    return output

def main():
  LOG_FORMAT = '%(asctime)s [facenet-unit]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  img_size = 160
  expected_img_shape = (img_size, img_size, 3)
  model_path = 'models/facenet_keras.h5'
  logging.info('I am a facenet-unit')
  facenet = Facenet(model_path, img_size)
  
  context = zmq.Context()
  # Socket to recieve work
  work_recv = context.socket(zmq.PULL)
  work_recv.connect(get_zmq_uri(FRONT_IP(), FRONT_ISSUE_PORT()))
  # Socket to send result
  result_sender = context.socket(zmq.PUSH)
  result_sender.connect(get_zmq_uri(RECO_SHED_IP(), RECO_SCHED_RECV_PORT()))

  logging.info('Begin receive works from front-end-server')

  while True:
    work = zmq_serdes.recv_zipped_pickle(work_recv)
    
    logging.info('Received a work from front-end-server (req_id={})'.format(work.req_id))
    
    if(work.img.shape!=expected_img_shape):
      """If image size dosen't match, reject it."""
      result = FaceIDMsg(work.req_id, work.req_type, ResState.REJECT, "")
    else:
      """Recognize the face"""
      face_id = facenet.calc_embs(work.img)
      result = FaceIDMsg(work.req_id, work.req_type, ResState.OK, face_id)

    zmq_serdes.send_zipped_pickle(result_sender, result)

if __name__ == "__main__":
    main()