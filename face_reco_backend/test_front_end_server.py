"""
test_front_end_server.py
Simple front-end server for test purpose 
"""

import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *
import threading
import numpy as np
import cv2
import os

# The thread to receive result from socket
class ResultReceiver(threading.Thread):
  def __init__(self, socket):
    threading.Thread.__init__(self)
    self.socket = socket

  def run(self):
    logging.info('Begin receive result to backend')
    while True:
      result = zmq_serdes.recv_zipped_pickle(self.socket)
      logging.info('[req_id={}] Received a result from backend.\n\tres_state={}\n\tuser_id={}'.format(result.req_id, result.res_state, result.user_id))

def load_image(name):
  img_dir = "./test_images/"
  img_path = os.path.abspath(img_dir+name)
  img = cv2.imread(img_path)

  # Scale image to proper size
  dst_size = 160
  img = cv2.resize(img, (dst_size, dst_size))
  img = np.expand_dims(img, axis=0)

  return img

def interactive_get_image():
  img = ()
  label = ()
  while True:
    img_name = input("Please input the file name of image: ")
    try:
      img = load_image(img_name)
      label = img_name.split('/')[0]
      break
    except:
      logging.info('Image {} does not exist'.format(img_name))
  return (img, label)


def main():
  LOG_FORMAT = '%(asctime)s [front-end-server]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  context = zmq.Context()
  # Socket to send work to backend
  work_sender = context.socket(zmq.PUSH)
  work_sender.bind(get_zmq_uri(FRONT_IP(), FRONT_ISSUE_PORT()))
  
  # Socket to receive result from backend
  result_recv = context.socket(zmq.PULL)
  result_recv.bind(get_zmq_uri(FRONT_IP(), FRONT_RECV_PORT()))

  logging.info('Begin send works to backend')
  
  # Start result receiver thread
  result_recv_thread = ResultReceiver(result_recv)
  result_recv_thread.start()

  req_id = 0
  while True:

    # Get the operation from interactive stdin
    cmd = input("Please input operation [n]ew/[r]ecognize: ")
    if cmd!="n" and cmd!="r":
      continue
    
    img, label = interactive_get_image()

    new_work = ()
    if cmd=="n":
      # Training new face
      new_work = PictureMsg(req_id, ReqType.NEW, img, label)
    else:
      # Recognize the face
      new_work = PictureMsg(req_id, ReqType.RECOG, img, "")

    zmq_serdes.send_zipped_pickle(work_sender, new_work)
    logging.info('Send works with req_id={}, label={} to backend'.format(req_id,new_work.label))

    # Monotonic increase the request id
    req_id+=1

  # Wait the result receiver thread to be done
  result_recv_thread.join()

if __name__ == "__main__":
    main()