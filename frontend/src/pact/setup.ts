import http from 'node:http'
import axios from 'axios'

// Pact starts a fresh mock server on a random port for every interaction. Node's global HTTP agent
// keeps sockets alive, so when a later interaction lands on a port an earlier one used, axios can
// reuse a socket to the server that has already shut down. The request then never reaches the new
// mock server and Pact reports "expected but not received". Fresh connections avoid that.
axios.defaults.httpAgent = new http.Agent({ keepAlive: false })
