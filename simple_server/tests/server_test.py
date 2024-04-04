import json

import requests
import time

qasm = """
OPENQASM 2.0;
include "qelib1.inc";

qreg q[2];
creg c[2];

reset q[0];
h q[0];
reset q[1];
cx q[0],q[1];
h q[0];
h q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];
"""

computers = requests.get("http://localhost:8000/computers")
print("Computers", computers.content)

print(requests.post("http://localhost:8000/start_job/GladOs", json={"qasm": qasm, "num_shots": 50}).content)
job_id = \
json.loads(requests.post("http://localhost:8000/start_job/GladOs", json={"qasm": qasm, "num_shots": 50}).content)[
    "job_id"]
print("Job id is", job_id)

done = False

while not done:
    status = requests.get(f"http://localhost:8000/job/{job_id}")
    print(status.content)
    time.sleep(1)
