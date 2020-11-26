BIG_SCORE = 1.e6  # type: float

import keras
from .particle import Particle
from .util import ProgressBar
from tensorflow.python.ops import nn
import os

class Optimizer:
    def __init__(self, model, loss,
                 n=10,
                 acceleration=0.1,
                 local_rate=1.0,
                 global_rate=1.0):

        self.n_particles = n
        self.model = model
        self.particles = [None] * n
        self.loss = loss
        self.length = len(model.get_weights())

        # Save the model to temporal file
        model.save('tmp.h5')

        params = {'acc': acceleration, 'local_acc': local_rate, 'global_acc': global_rate}

        for i in range(n):
            m = keras.models.load_model('tmp.h5', custom_objects={'nn': nn})
            m.compile(loss=loss,optimizer='sgd')
            self.particles[i] = Particle(m, params)

        # Remove the temporal model file
        os.remove('tmp.h5')

        self.global_best_weights = None
        self.global_best_score = BIG_SCORE

    def fit(self, x, y, steps=0, batch_size=32):
        num_batches = x[0].shape[0] // batch_size

        for i, p in enumerate(self.particles):
            local_score = p.get_score(x, y)

            if local_score < self.global_best_score:
                self.global_best_score = local_score
                self.global_best_weights = p.get_best_weights()

        print("PSO -- Initial best score {:0.4f}".format(self.global_best_score))

        #bar = ProgressBar(steps, updates=50)

        for i in range(steps):
            for j in range(num_batches):
                x_ = []
                for batch_x in x:
                    x_.append(batch_x[j*batch_size:(j+1)*batch_size,:])
                y_ = y[j*batch_size:(j+1)*batch_size]

                for p in self.particles:
                    local_score = p.step(x_, y_, self.global_best_weights)

                    if local_score < self.global_best_score:
                        self.global_best_score = local_score
                        self.global_best_weights = p.get_best_weights()
            print("PSO ({}/{}) -- Current best score {:0.4f}".format(i+1,steps,self.global_best_score))
            #bar.update(i)

        #bar.done()

    def get_best_model(self):
        best_model = self.model
        best_model.set_weights(self.global_best_weights)
        best_model.compile(loss=self.loss,optimizer='sgd')
        return best_model
