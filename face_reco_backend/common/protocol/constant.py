# The input image shape of deep-unit.
# The width and hight is both 160px.
# The color channel is 3.
# Due to the origin model is batch input, the input array need to be 4-dims
DEEP_INPUT_SHAPE = lambda: (1, 160, 160, 3)

# The output feature shape of deep-unit
FEATURE_SHAPE = lambda: (1,1792)

# The input array of training-unit
# The recognize scheduler should arange 10 features into on training bundle
TRAINING_INPUT_SHAPE = lambda: (10, FEATURE_SHAPE()[1])