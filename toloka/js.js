const deployUrl = 'https://toloka-data-exchange-sample.herokuapp.com';

// Define our custom interface
exports.Task = extend(TolokaHandlebarsTask, function (options) {
    TolokaHandlebarsTask.call(this, options);
}, {
    onRender: function () {
        const inputKey = this.getTask().input_values.input_key;
        const assignmentId = this.getAssignment().getId();

        // Change URL of image content in the task to data storage backend
        // Pass assignmentId and input_key to check the access (see /index.js)
        $(this.getDOMElement())
            .find('img.data')
            .attr('src', `${deployUrl}/data/${inputKey}?assignmentId=${assignmentId}`);
    },
});

// Define our custom results submit policy
exports.Assignment = extend(TolokaAssignment, function (options) {
    TolokaAssignment.call(this, options);
}, {
    provideSolutions: async function(
        strategy = function (solutions) {
            // Trigger submitting the assignment
            this.getSandboxChannel()
                .triggerOut('assignment:submit', {
                    solutions: solutions,
                    assignmentId: this.getId()
                })
        },
        errorCallback = function (errors) {
            // Do nothing by default
        }
    ) {
        let solutions = this.getTaskSuite().getSolutions();

        // Store real results on data storage backend side
        const result = await $.ajax(
            {
                url: `${deployUrl}/result`,
                type: 'PUT',
                data: { solutions },
                dataType: 'json'
            }
        );

        // Get a reference to the stored results
        const outputKey = result.key;

        // Patch solutions and change the real results to the reference key
        solutions = solutions.map(s => ({...s, output_values: { output_key: result.key }}))

        // Validate by the specification
        const errors = await Promise.resolve(this.getTaskSuite().validate(solutions))
        if (!errors) {
            // If no errors, pass results further
            strategy.call(this, solutions);
        } else {
            // If some errors, trigger an event of the failed validation
            this.getSandboxChannel().triggerOut('assignment:validation:fail', errors);
            errorCallback.call(this, errors);
        }
    }
});

function extend(ParentClass, constructorFunction, prototypeHash) {
    constructorFunction = constructorFunction || function () {
    };
    prototypeHash = prototypeHash || {};
    if (ParentClass) {
        constructorFunction.prototype = Object.create(ParentClass.prototype);
    }
    for (var i in prototypeHash) {
        constructorFunction.prototype[i] = prototypeHash[i];
    }
    return constructorFunction;
}