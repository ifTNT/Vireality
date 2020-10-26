"""
test_front_end_server.py
Simple front-end server for test purpose 
"""

import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *

def main():
  LOG_FORMAT = '%(asctime)s [front-end-server]: [%(levelname)s] %(message)s'
  logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

  context = zmq.Context()
  # Socket to send work to backend
  work_sender = context.socket(zmq.PUSH)
  work_sender.bind(get_zmq_uri(FRONT_IP(), FRONT_ISSUE_PORT()))
  # Socket to receive result from backend
  result_recv = context.socket(zmq.PULL)
  result_recv.bind(get_zmq_uri(FRONT_IP(), FRONT_ISSUE_PORT()))

  logging.info('Begin send works to backend')

  req_id = 0
  while True:
    work = PictureMsg(req_id, ReqType, )
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