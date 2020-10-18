from collections import namedtuple
from enum import Enum
import numpy as np

# The enumerate of response states
class ResState(Enum):
  OK = 'ok'           # Success without error
  REJECT = 'reject'   # The invaild request has been rejected
  PENDING = 'pending' # The request is pending
  ERROR = 'error'     # Have trouble

# The enumerate of request type
class ReqType(Enum):
  NOP = 'nop'    # Default operation
  RECOG = 'recog'  # Request the system to recognize the face
  NEW = 'new'    # Request the system to train new model with new face

PictureMsg = namedtuple("PictureMsg", "req_id req_type img")
FeatureMsg = namedtuple("FeatureMsg", "req_id req_type res_state face_id")
UserIDMsg = namedtuple("UserIDMsg", "req_id res_state user_id")
