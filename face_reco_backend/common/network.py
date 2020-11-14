# The port that belong to front-end-server to issue picture
FRONT_ISSUE_PORT = lambda: ('tcp', '5555')

# The port that belong to reco-scheduler to receive face-id from facenet
RECOG_SCHED_RECV_PORT = lambda: ('tcp', '5556')

# The port that belong to reco-scheduler to issue face-id to recognize unit
RECOG_ISSUE_PORT = lambda: ('tcp', '5557')

# The port that belong to reco-scheduler to issue face-id to training unit
TRAIN_ISSUE_PORT = lambda: ('tcp', '5558')

# The port that belong to training unit to publish new-trained model to recognize unit
TRAIN_PUBLISH_PORT = lambda: ('tcp', '5559')

# The port that belong to front-end-server to receive the result of recognition
FRONT_RECV_PORT = lambda: ('tcp', '5560')

# The IP address of front-end-server, reco-scheduler and training unit
FRONT_IP = lambda: "127.0.0.1"
RECOG_SCHED_IP = lambda: "127.0.0.1"
TRAIN_IP = lambda: "127.0.0.1"

def get_zmq_uri(ip, port):
  return "{}://{}:{}".format(port[0], ip, port[1])
