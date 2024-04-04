from enum import Enum
from flask import Flask, jsonify
from fastapi.middleware.cors import CORSMiddleware  # Correct import for CORS
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
import time
from typing import List, Union, Dict, Optional
from qiskit import QuantumCircuit, Aer, execute
import uuid
import threading

from qiskit.qasm import QasmError
from flask_cors import CORS

app = FastAPI()
JobUUID = str

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

JobUUID = str

def _execute_single_shot_on_sim(circuit: QuantumCircuit, simulator) -> str:
    result = execute(circuit, simulator, shots=1).result()
    assert len(result.get_counts().keys()) == 1, "There should be only one result"
    return list(result.get_counts().keys())[0]


class JobStatus(str, Enum):
    RUNNING = "running"
    FAILED = "failed"
    DONE = "done"


class ExecutionJobStatusResult(BaseModel):
    status: JobStatus
    results: Optional[List[str]]
    error: Optional[str]


class ExecutionPayload(BaseModel):
    qasm: str
    num_shots: int


class ExecutionJob(BaseModel):
    job_id: JobUUID


class QuantumComputer:
    def __init__(self, name: str):
        self.name = name
        self.queue_time = random.randint(0, 60)

    def run_circuit(self, qasm: str, shots: int, result: ExecutionJobStatusResult) -> None:
        try:
            circuit = QuantumCircuit.from_qasm_str(qasm)
        except QasmError as e:
            result.status = JobStatus.FAILED
            result.results = None
            result.error = f'QASM parse error: {str(e)}'
            return

        simulator = Aer.get_backend('qasm_simulator')
        time.sleep(self.queue_time)
        result_of_shots = [_execute_single_shot_on_sim(circuit, simulator) for _ in range(shots)]
        result.status = JobStatus.DONE
        result.results = result_of_shots


computers = [QuantumComputer(f"GladOs"), QuantumComputer(f"HAL-9000"), QuantumComputer(f"TARS"),
             QuantumComputer(f"Quanti")]


class JobManager:
    def __init__(self):
        self._jobs = {}

    def create_job(self, computer: QuantumComputer, payload: ExecutionPayload) -> JobUUID:
        result = ExecutionJobStatusResult(status=JobStatus.RUNNING, results=None, error=None)
        threading.Thread(target=computer.run_circuit, args=(payload.qasm, payload.num_shots, result)).start()
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = result
        return job_id

    def has_job(self, job_id: JobUUID) -> bool:
        return job_id in self._jobs

    def job_result(self, job_id: JobUUID) -> ExecutionJobStatusResult:
        return self._jobs[job_id]


jobs = JobManager()


@app.get("/computers")
def get_computers() -> List[Dict[str, Union[str, int]]]:
    return [{"name": c.name, "queue_time": c.queue_time} for c in computers]


@app.post("/start_job/{computer_name}")
def start_job(computer_name: str, payload: ExecutionPayload) -> ExecutionJob:
    for c in computers:
        if c.name == computer_name:
            return ExecutionJob(job_id=jobs.create_job(computer=c, payload=payload))
    raise HTTPException(status_code=404, detail="No such computer")


@app.get("/job/{job_id}")
def poll_job_status(job_id: str) -> ExecutionJobStatusResult:
    if jobs.has_job(job_id):
        return jobs.job_result(job_id)
    else:
        raise HTTPException(status_code=404, detail="Job not found")

if __name__ == "__main__":
    app.run(debug=True, port=8080)