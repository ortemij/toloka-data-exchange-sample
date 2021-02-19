const deployUrl = 'https://toloka-data-exchange-sample.herokuapp.com';

// Define our custom interface
exports.Task = extend(TolokaHandlebarsTask, function (options) {
    TolokaHandlebarsTask.call(this, options);
  }, {
    onRender: function() {
      const inputKey = this.getTask().input_values.input_key;
      const assignment = this.getAssignment();
      const assignmentId = assignment.getId();
  
      // Change URL of image content in the task to data storage backend
      // Pass assignmentId and input_key to check the access (see /index.js)
      $(this.getDOMElement()).find('img.data').attr('src', `${deployUrl}/data/${inputKey}?assignmentId=${assignmentId}`);
  
      // Attach on-click listener
      const task = this;
      $(task.getDOMElement()).find('.submit').click(function (e) {
        // Get value from the input field
        var secret = $(task.getDOMElement()).find('.secret').val();

        // Call data storage backend
        $.ajax(
          {
            url: `${deployUrl}/result`,
            type: 'PUT',
            data: {
            secret: secret
            },
            dataType: 'json'
          }
        )
        .then(function (result) {
          // Get key from result and set it to output of the task
          // This key will be stored in Toloka as task result
          task.setSolutionOutputValue('output_key', result.key);

          delete task.getSolution().output_values['secret'];

          // Submit the task after the output is ready
          // Since the system 'Submit' button is hidden, make this explicitly
          assignment.submit()
        });
      });
    },

    onDestroy: function () {
      $(this.getDOMElement()).find('.submit').off('click');
    }
  });
  
  function extend(ParentClass, constructorFunction, prototypeHash) {
    constructorFunction = constructorFunction || function () {};
    prototypeHash = prototypeHash || {};
    if (ParentClass) {
      constructorFunction.prototype = Object.create(ParentClass.prototype);
    }
    for (var i in prototypeHash) {
      constructorFunction.prototype[i] = prototypeHash[i];
    }
    return constructorFunction;
  }