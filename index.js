const express = require('express')
const cors = require('cors')
const got = require('got')
const path = require('path')
const fs = require('fs')
const crypto = require("crypto")

const PORT = process.env.PORT || 5000

// Settings for Toloka API
const TOLOKA_API_ENDPOINT = process.env.TOLOKA_API_ENDPOINT || 'https://sandbox.toloka.yandex.com/api/v1'
const TOLOKA_API_TOKEN = process.env.TOLOKA_API_TOKEN

// Helper function for transfering 
const transferData = (key, res) => {
    var stream = fs.createReadStream(path.join(__dirname, 'data', `${key}.jpg`))
    res.contentType('image/jpeg')
    stream.on('open', () => {
        stream.pipe(res)
    })
}

const app = express()
app.use(express.json())

// Endpoint for serving data upon request
app.get('/data/:requestedKey', (req, res) => {
    const assignmentId = req.query.assignmentId
    const requestedKey = req.params.requestedKey
    
    // Testing mode (?assignmentId=undefined in a project preview)
    if (assignmentId == 'undefined') {
        transferData('undefined', res)
        return
    }

    // Call Toloka back to get information about the assignment with given id
    got(`${TOLOKA_API_ENDPOINT}/assignments/${assignmentId}`, {
        headers: {
            'Authorization': `OAuth ${TOLOKA_API_TOKEN}`
        },
        responseType: 'json'
    })
    .then(tlkRes => {
        if (tlkRes.statusCode == 200) {
            // Get status of the assignment
            const assignmentStatus = tlkRes.body && tlkRes.body.status

            // Check whether the assignment is active
            if (assignmentStatus != 'ACTIVE') {
                // If no, access is denied
                res.status(403).send('Assignment is inactive');
                return
            }

            const keyMatched = 
                tlkRes.body && 
                tlkRes.body.tasks && 
                tlkRes.body.tasks.some(t => t.input_values && t.input_values.input_key == requestedKey)   

            if (!keyMatched) {
                // If no, access is denied
                res.status(403).send('Key mismatched')
            } else {
                // If yes, serve content by the requested key
                transferData(requestedKey, res)
            }
        }
    })
    .catch(error => {
        console.log(error)
        res.status(403).send('Error while Toloka API call')
    })
})

// Setup CORS to be able send AJAX requests from toloker interface
const corsOptions = {
    origin: 'https://iframe-toloka.com'
}

app.options('/result', cors(corsOptions))

// Endpoint for storing results and returning output_key back
app.put('/result', cors(corsOptions), (req, res) => {
    // Generate random output key (possible collisions, just for example)
    const outputKey = crypto.randomBytes(3).toString('hex')

    // Log the key and the real result (here should be some persistence)
    console.log(`Got for key=${outputKey} result: ${req.body}`)

    // Send the key for "stored" data back to Toloka
    res.send({
        key: outputKey
    })
})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
