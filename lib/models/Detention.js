const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true
  },
  releaseDate: Date,
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person'
  },
  arrestingAgency: String,
  bookingStates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingState'
    }
  ],
  caseStates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourtCase'
    }
  ],
  currentBookingState:     {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingState'
  },
  currentCaseState:     {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourtCase'
  }
});

schema.statics.countDaily = function(){
  return this.aggregate([
    { '$match': {
      bookingDate: { $gte:  new Date().toISOString().split('T')[0] }
    }
    },
    { $count: 'total' }
  ]);
};

schema.statics.avgDetentionDuration = function(){

  return this.aggregate([
    { '$match': {
      bookingDate : { $gte: new Date('2020-01-16T08:00:00.000+00:00') }
    }
    },
    { '$group': {
      '_id': null,
      avgDifference: {
        $avg: {
          $subtract: ['$releaseDate', '$bookingDate']
        }
      }
    }
    }
  ]);
};

schema.statics.avgDetentionByRace = function(){

  return this.aggregate([
    { '$match': {
      bookingDate : { $gte: new Date('2020-01-16T08:00:00.000+00:00') }
    }
    },
    {
      '$lookup': {
        'from': 'people',
        'localField': 'person',
        'foreignField': '_id',
        'as': 'person'
      }
    }, {
      '$unwind': {
        'path': '$person'
      }
    }, {
      '$replaceRoot': {
        'newRoot': {
          '$mergeObjects': [
            '$person', '$currentCase', '$$ROOT'
          ]
        }
      }
    },
    { '$group': {
      '_id': '$race',
      avgDifference: {
        $avg: {
          $subtract: ['$releaseDate', '$bookingDate']
        }
      }
    }
    }
  ]
  );
};

schema.statics.avgDetentionByGender = function(){

  return this.aggregate([
    { '$match': {
      bookingDate : { $gte: new Date('2020-01-16T08:00:00.000+00:00') }
    }
    }, {
      '$lookup': {
        'from': 'people',
        'localField': 'person',
        'foreignField': '_id',
        'as': 'person'
      }
    }, {
      '$unwind': {
        'path': '$person'
      }
    }, {
      '$replaceRoot': {
        'newRoot': {
          '$mergeObjects': [
            '$person', '$currentCase', '$$ROOT'
          ]
        }
      }
    }, { '$group': {
      '_id': '$gender',
      avgDifference: {
        $avg: {
          $subtract: ['$releaseDate', '$bookingDate']
        }
      }
    }
    }
  ]
  );
};

schema.statics.countByAgency = function(){

  return this.aggregate([
    { '$group' : { _id:'$arrestingAgency', count:{ $sum:1 } } }

  ]
  );
};

schema.statics.getChargesByRace = function(page, perPage) {
  return this.aggregate(
    [
      {
        '$lookup': {
          'from': 'people',
          'localField': 'person',
          'foreignField': '_id',
          'as': 'person'
        }
      }, {
        '$lookup': {
          'from': 'bookingstates',
          'localField': 'currentBookingState',
          'foreignField': '_id',
          'as': 'booking'
        }
      }, {
        '$lookup': {
          'from': 'courtcases',
          'localField': 'currentCaseState',
          'foreignField': '_id',
          'as': 'currentCase'
        }
      }, {
        '$unwind': {
          'path': '$person'
        }
      }, {
        '$unwind': {
          'path': '$booking'
        }
      }, {
        '$unwind': {
          'path': '$currentCase'
        }
      }, {
        '$replaceRoot': {
          'newRoot': {
            '$mergeObjects': [
              '$person', '$booking', '$currentCase', '$$ROOT'
            ]
          }
        }
      }, {
        '$unwind': {
          'path': '$charges'
        }
      }, {
        '$group': {
          '_id': {
            'description': '$charges.description',
            'race': '$race'
          },
          'count': {
            '$sum': 1
          }
        }
      }, {
        '$group': {
          '_id': '$_id.description',
          'counts': {
            '$push': {
              'k': '$_id.race',
              'v': '$count'
            }
          },
          'total': {
            '$sum': '$count'
          }
        }
      }, {
        '$project': {
          'raceCounts': {
            '$arrayToObject': '$counts'
          },
          'total': '$total'
        }
      }, {
        '$sort': {
          'total': -1
        }
      }, {
        '$skip': (page - 1) * perPage
      }, {
        '$limit': perPage
      }
    ]
  );
};

schema.statics.getChargesByAgency = function(page, perPage) {
  return this.aggregate(
    [
      {
        '$lookup': {
          'from': 'people',
          'localField': 'person',
          'foreignField': '_id',
          'as': 'person'
        }
      }, {
        '$lookup': {
          'from': 'bookingstates',
          'localField': 'currentBookingState',
          'foreignField': '_id',
          'as': 'booking'
        }
      }, {
        '$lookup': {
          'from': 'courtcases',
          'localField': 'currentCaseState',
          'foreignField': '_id',
          'as': 'currentCase'
        }
      }, {
        '$unwind': {
          'path': '$person'
        }
      }, {
        '$unwind': {
          'path': '$booking'
        }
      }, {
        '$unwind': {
          'path': '$currentCase'
        }
      }, {
        '$replaceRoot': {
          'newRoot': {
            '$mergeObjects': [
              '$person', '$booking', '$currentCase', '$$ROOT'
            ]
          }
        }
      }, {
        '$unwind': {
          'path': '$charges'
        }
      }, {
        '$group': {
          '_id': {
            'description': '$charges.description',
            'agency': '$arrestingAgency'
          },
          'count': {
            '$sum': 1
          }
        }
      }, {
        '$group': {
          '_id': '$_id.description',
          'counts': {
            '$push': {
              'k': '$_id.agency',
              'v': '$count'
            }
          },
          'total': {
            '$sum': '$count'
          }
        }
      }, {
        '$project': {
          'agencyCounts': {
            '$arrayToObject': '$counts'
          },
          'total': '$total'
        }
      }, {
        '$sort': {
          'total': -1
        }
      }, {
        '$skip': (page - 1) * perPage
      }, {
        '$limit': perPage
      }
    ]
  );
};

schema.statics.getChargesByGender = function(page, perPage) {
  return this.aggregate([
    {
      '$lookup': {
        'from': 'people',
        'localField': 'person',
        'foreignField': '_id',
        'as': 'person'
      }
    }, {
      '$lookup': {
        'from': 'bookingstates',
        'localField': 'currentBookingState',
        'foreignField': '_id',
        'as': 'booking'
      }
    }, {
      '$lookup': {
        'from': 'courtcases',
        'localField': 'currentCaseState',
        'foreignField': '_id',
        'as': 'currentCase'
      }
    }, {
      '$unwind': {
        'path': '$person'
      }
    }, {
      '$unwind': {
        'path': '$booking'
      }
    }, {
      '$unwind': {
        'path': '$currentCase'
      }
    }, {
      '$replaceRoot': {
        'newRoot': {
          '$mergeObjects': [
            '$person', '$booking', '$currentCase', '$$ROOT'
          ]
        }
      }
    }, {
      '$unwind': {
        'path': '$charges'
      }
    }, {
      '$group': {
        '_id': {
          'description': '$charges.description',
          'gender': '$gender'
        },
        'count': {
          '$sum': 1
        }
      }
    }, {
      '$group': {
        '_id': '$_id.description',
        'counts': {
          '$push': {
            'k': '$_id.gender',
            'v': '$count'
          }
        },
        'total': {
          '$sum': '$count'
        }
      }
    }, {
      '$project': {
        'genderCounts': {
          '$arrayToObject': '$counts'
        },
        'total': '$total'
      }
    }, {
      '$sort': {
        'total': -1
      }
    }, {
      '$skip': (page - 1) * perPage
    }, {
      '$limit': perPage
    }
  ]);
};

schema.statics.countByTime = function() {
  return this.aggregate([
    { '$group' : {
      '_id': { $hour: '$bookingDate' }, count:{ $sum:1 } }
    }, {
      '$sort': {
        '_id': 1
      }
    },
  ]);
};

schema.statics.getCurrentDetentions = function() {
  return this.aggregate([
    [
      {
        '$match': {
          'releaseDate': null
        }
      }, {
        '$lookup': {
          'from': 'people', 
          'localField': 'person', 
          'foreignField': '_id', 
          'as': 'person'
        }
      }, {
        '$unwind': {
          'path': '$person'
        }
      }, {
        '$lookup': {
          'from': 'bookingstates', 
          'localField': 'currentBookingState', 
          'foreignField': '_id', 
          'as': 'bookingState'
        }
      }, {
        '$unwind': {
          'path': '$bookingState'
        }
      }, {
        '$lookup': {
          'from': 'courtcases', 
          'localField': 'currentCaseState', 
          'foreignField': '_id', 
          'as': 'currentCase'
        }
      }, {
        '$unwind': {
          'path': '$currentCase'
        }
      }, {
        '$unwind': {
          'path': '$currentCase.charges'
        }
      }
    ]
  ]);
};


module.exports = mongoose.model('Detention', schema);
