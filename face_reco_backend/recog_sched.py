"""
recog_sched.py
The main script of recognize-scheduler of face recognition backend.
"""

import time
import sys
import numpy as np
# Prevent array truncation while printing nparray
np.set_printoptions(threshold=sys.maxsize)

import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *
from common.protocol.constant import FEATURE_SHAPE, TRAIN_INPUT_SHAPE

def send_reject(socket, req_id):
  reject_msg = UserIDMsg(req_id, ResState.REJECT, "")
  zmq_serdes.send_zipped_pickle(socket, reject_msg)


train_buffer = {}

def main():
  LOG_FORMAT = '%(asctime)s [recog-sched]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  logging.info('I am a recog-sched')
  
  context = zmq.Context()
  
  # Socket to receive work
  work_recv = context.socket(zmq.PULL)
  work_recv.bind(get_zmq_uri(RECOG_SCHED_IP(), RECOG_SCHED_RECV_PORT()))
  
  # Socket to send rejected result to front-end-server
  reject_sender = context.socket(zmq.PUSH)
  reject_sender.connect(get_zmq_uri(FRONT_IP(), FRONT_RECV_PORT()))
  
  # Socket to send recognize request to recognize-unit
  recog_sender = context.socket(zmq.PUSH)
  recog_sender.bind(get_zmq_uri(RECOG_SCHED_IP(), RECOG_ISSUE_PORT()))
  
  # Socket to send training request to training-unit
  train_sender = context.socket(zmq.PUSH)
  train_sender.bind(get_zmq_uri(RECOG_SCHED_IP(), TRAIN_ISSUE_PORT()))

  logging.info('Begin receive works from deep-unit')

  while True:
    work = zmq_serdes.recv_zipped_pickle(work_recv)
    
    logging.info('Received a result from deep-unit (req_id={})'.format(work.req_id))
    
    #If the request is rejected by deep unit
    if work.res_state == ResState.REJECT:
      logging.info('[req_id={}] Forwarding rejected result to front-end-server'.format(work.req_id))
      send_reject(reject_sender, work.req_id)
      continue
    
    #If the result of deep unit mismatch
    if work.face_id.shape != FEATURE_SHAPE():
      logging.info('[req_id={}] The shape of feature mismatch. shape={}'.format(work.req_id, work.face_id.shape))
      send_reject(reject_sender, work.req_id)
      continue
    
    #If the request type is recognize request
    if work.req_type == ReqType.RECOG:
      logging.info('[req_id={}] Forwarding recognize request to recog-unit'.format(work.req_id))
      recog_msg = RecogMsg(work.req_id, work.face_id)
      zmq_serdes.send_zipped_pickle(recog_sender, recog_msg)
      continue
      
    #If the request type is training request
    if work.req_type == ReqType.NEW:
      if work.label == "":
        logging.info('[req_id={}] Rejected training request with empty label'.format(work.req_id))
        send_reject(reject_sender, work.req_id)
        continue

      logging.info('[req_id={}] Buffering training request'.format(work.req_id))

      label = work.label
      if label in train_buffer.keys():
        new_bundle = np.concatenate((work.face_id, train_buffer[label]))
        train_buffer[label] = new_bundle
      else:
        train_buffer[label] = work.face_id

      # Forward success recognize response to front-end-server
      # The message multiplexed the UserIDMsg to prevent complex parsing.
      elems_train_buffer = train_buffer[label].shape[0]
      new_success_msg = UserIDMsg(work.req_id, ResState.OK, elems_train_buffer)
      zmq_serdes.send_zipped_pickle(reject_sender, new_success_msg)

      logging.info('[req_id={}] Shape of training buffer = {}'.format(work.req_id, train_buffer[label].shape))

      # If the training bundle is satisfied
      if train_buffer[label].shape == TRAIN_INPUT_SHAPE():
        logging.info('[req_id={}] Training bundle of label={} satisfied. Send to train-unit'.format(work.req_id, label))
        train_msg = TrainMsg(label, train_buffer[label])
        zmq_serdes.send_zipped_pickle(train_sender, train_msg)

        # Clear the training buffer
        del train_buffer[label]



if __name__ == "__main__":
    main()