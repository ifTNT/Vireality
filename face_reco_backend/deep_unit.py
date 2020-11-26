"""
deep_unit.py
The main script of deep-unit of face recognition backend.
"""

import time
import sys
import numpy as np
# Prevent array truncation while printing nparray
np.set_printoptions(threshold=sys.maxsize)
import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'
import cv2
from skimage.transform import resize

from keras.models import load_model
from keras.models import Model
import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *
from common.protocol.constant import IMAGE_SIZE, DEEP_INPUT_SHAPE

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

def main():
  LOG_FORMAT = '%(asctime)s [deep-unit]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  model_path = 'models/Inception_ResNet_v1_MS_Celeb_1M.h5'
  cascade_path = os.path.abspath('./models/haarcascade_frontalface_alt2.xml')
  logging.info('I am a deep-unit')
  cascade = cv2.CascadeClassifier(cascade_path)
  logging.info('Haar cascade classifier loaded.')
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
    
    # Find the face from given image
    faces = cascade.detectMultiScale(work.img[0],
                                      scaleFactor=1.1,
                                      minNeighbors=3)
    margin = 10
    # If there is no face found, reject it
    if len(faces) == 0:
      logging.info('[req_id={}] No face found, rejected. Image size={}'.format(work.req_id, work.img.shape))
      result = FeatureMsg(work.req_id, work.req_type, ResState.REJECT, "", "")
    else:
      print(faces)

      # Crop and resize the image to fit the input shape of CNN
      (x, y, w, h) = faces[0]
      cropped_img = work.img[0][max(y-margin//2, 0):y+h+margin//2,
                    max(x-margin//2,0):x+w+margin//2, :]
      
      aligned_img = resize(cropped_img, (IMAGE_SIZE(), IMAGE_SIZE()), mode='reflect')

      # [DEBUG] Display aligned images
      disp_img = np.array(aligned_img, dtype=np.float32)
      disp_img = cv2.cvtColor(disp_img, cv2.COLOR_RGB2BGR)
      cv2.imshow('Aligned image', disp_img)
      cv2.waitKey(1)

      aligned_img = np.array([aligned_img])
    
      # Recognize the face
      face_id = facenet.calc_embs(aligned_img)
      result = FeatureMsg(work.req_id, work.req_type, ResState.OK, face_id, work.label)
      logging.info('[req_id={}] Feature caculated!. Shape of feature = {}'.format(work.req_id, result.face_id.shape))
      #logging.debug('Feature: \n{}'.format(result.face_id))

    zmq_serdes.send_zipped_pickle(result_sender, result)
  
  # [DEBUG] Distroy window of image showing
  cv2.destroyAllWindows()

if __name__ == "__main__":
    main()