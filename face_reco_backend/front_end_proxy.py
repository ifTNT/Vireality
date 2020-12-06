"""
front_end_proxy.py
The front-end relay between face-recognition-backend and web server
"""

import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *
from common.protocol.constant import DEEP_INPUT_SHAPE
import threading
import numpy as np
import cv2
import os
import base64

# The thread to relay result from recv_sock to send_sock
class ResultReceiver(threading.Thread):
  def __init__(self, recv_sock, send_sock):
    threading.Thread.__init__(self)
    self.recv_sock = recv_sock
    self.send_sock = send_sock

  def run(self):
    logging.info('Begin receive results from backend')
    while True:
      result = zmq_serdes.recv_zipped_pickle(self.recv_sock)
      logging.info('[req_id={}] Received a result from backend.\n\tres_state={}\n\tuser_id={}'.format(result.req_id, result.res_state, result.user_id))

      # Convert message to JSON and relay to express.
      result_json = {
        'req_id': result.req_id,
        'res_state': result.res_state.value,
        'user_id': result.user_id
      }

      #zmq_serdes.send_json(self.send_sock, result_json)
      self.send_sock.send_json(result_json)

# The thread to relay works from recv_sock to send_sock
class WorkSender(threading.Thread):
  def __init__(self, recv_sock, send_sock):
    threading.Thread.__init__(self)
    self.recv_sock = recv_sock
    self.send_sock = send_sock

  def run(self):
    logging.info('Begin receive works from express')
    while True:
      work = zmq_serdes.recv_json(self.recv_sock)
      # Discard invaild message
      if 'req_id' not in work.keys() or 'type' not in work.keys():
        logging.info("Discarded invaild message.")
        continue
      
      logging.info(
        '[req_id={}] Received a work from express. type={}'.format(
          work['req_id'], work['type']
        )
      )
      # Convert carried images from data url to numpy array
      work['img'] = self.__dataurl2np(work['img'])
      if work['type']=="new":
        # Discard invaild message
        if 'label' not in work.keys():
          logging.info("Discarded invaild message.")
          continue
        # Training new face
        new_work = PictureMsg(
          work['req_id'],
          ReqType.NEW,
          work['img'],
          work['label'])
      else:
        # Recognize the face
        new_work = PictureMsg(
          work['req_id'],
          ReqType.RECOG,
          work['img'],
          ""
        )

      zmq_serdes.send_zipped_pickle(self.send_sock, new_work)
      logging.info('Send works with req_id={}, label={} to backend'.format(new_work.req_id,new_work.label))

  # Return the numpy array converted from data url in RGB order
  def __dataurl2np(self, data_url):
    encoded_img = data_url.split(",")[1]
    decoded_img = base64.b64decode(encoded_img)
    decoded_img = np.asarray(bytearray(decoded_img), dtype=np.uint8)

    np_img = cv2.imdecode(decoded_img, cv2.IMREAD_COLOR)
    np_img = np.array(np_img, dtype=np.uint8 )

    # [DEBUG] Show the image
    #cv2.imshow('Received image from express', np_img)
    #cv2.waitKey(1)

    np_img = cv2.cvtColor(np_img, cv2.COLOR_BGR2RGB)

    # Expand dimentions to satisfy the protocol
    np_img = np.expand_dims(np_img, axis=0)
    
    return np_img

def main():
  LOG_FORMAT = '%(asctime)s [front-end-proxy]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  context = zmq.Context()
  # Socket to receive work from express
  work_recv = context.socket(zmq.PULL)
  work_recv.connect(get_zmq_uri(EXPRESS_IP(), EXPRESS_ISSUE_PORT()))
  # Socket to send work to backend
  work_send = context.socket(zmq.PUSH)
  work_send.bind(get_zmq_uri(FRONT_IP(), FRONT_ISSUE_PORT()))
  
  # Socket to receive result from backend
  result_recv = context.socket(zmq.PULL)
  result_recv.bind(get_zmq_uri(FRONT_IP(), FRONT_RECV_PORT()))
  # Socket to send result to express
  result_send = context.socket(zmq.PUSH)
  result_send.connect(get_zmq_uri(EXPRESS_IP(), EXPRESS_RECV_PORT()))
  
  # Start the work sender thread
  work_send_thread = WorkSender(work_recv, work_send)
  work_send_thread.start()

  # Start result receiver thread
  result_recv_thread = ResultReceiver(result_recv, result_send)
  result_recv_thread.start()

  # Wait the children thread to be done
  result_recv_thread.join()
  work_send_thread.join()

  # [DEBUG] Distroy window of image showing
  cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
