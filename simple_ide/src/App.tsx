import CodeMirror, { oneDark } from "@uiw/react-codemirror";
import { Box, Button, Container, Grid } from "@mui/material";
import { basicSetup } from "codemirror";
import qasm from "./qasm.ts";
import { ReactNode, useCallback, useEffect, useState } from "react";
import axios from "axios";

const defaultQASM = `OPENQASM 2.0;
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
measure q[1] -> c[1];`;

type QuantumComputer = {
  [x: string]: ReactNode;
  name: string;
  que_tim: number;
};

function App() {
  const [editorCode, setEditorCode] = useState<string>(defaultQASM);
  const [computers, setComputers] = useState<QuantumComputer[]>([]);
  const [selectComputer, setSelectComputer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [jobId, setJobId] = useState("");
  const [jobStatus, setJobStatus] = useState("");
  const [jobResults, setJobResults] = useState([]);

  const getComputers = useCallback(async () => {
    try {
      const { data } = await axios.get("http://localhost:8000/computers");
      setComputers(data);
      if (computers) {
        setIsLoading(false);
        setSelectComputer(data[0].name);
      }
    } catch (err) {
      console.error("Error fetching quantum computers:", err);
      setError("Failed to load quantum computers. Please try again later.");
    }
    return () => {
      setIsLoading(false);
      setComputers([]);
    };
  }, [computers]);

  useEffect(() => {
    getComputers();
  }, []);

  const runQuantumCircuit = async () => {
    try {
      const payload = {
        qasm: editorCode,
        num_shots: 1, // Set this to the desired number of shots
      };
      const { data } = await axios.post(
        `http://localhost:8000/start_job/${selectComputer}`,
        payload
      );
      setJobId(data.job_id);
      pollJobStatus(data.job_id); // Start polling for job status
    } catch (err) {
      console.error("Error submitting job:", err);
      setError("Failed to submit job. Please try again later.");
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const statusCheck = setInterval(async () => {
        const { data } = await axios.get(`http://localhost:8000/job/${jobId}`);
        setJobStatus(data.status);
        if (data.status === "DONE" || data.status === "FAILED") {
          clearInterval(statusCheck);
          if (data.results) {
            setJobResults(data.results);
          }
          if (data.error) {
            setError(data.error);
          }
        }
      }, 2000); // Check every 2 seconds
    } catch (err) {
      console.error("Error polling job status:", err);
      setError("Failed to get job status. Please try again later.");
    }
  };

  return (
    <Container>
      {isLoading ? (
        <label>Loading Quantum Computer...</label>
      ) : (
        <div>
          <div>
            <label htmlFor='quantum-computer-selector'>
              Choose a Quantum Computer:
            </label>
          </div>
          <select
            id='quantum-computer-selector'
            value={selectComputer}
            onChange={(e) => setSelectComputer(e.target.value)}
            disabled={computers.length === 0}>
            {computers.map((computer, index) => (
              <option key={index} value={computer.name}>
                {computer.name} - Queue Time: {computer.queue_time}
              </option>
            ))}
          </select>
        </div>
      )}
      <Box
        display='flex'
        flexDirection='column'
        justifyContent='center'
        alignItems='center'
        style={{ minHeight: "100vh" }}>
        <Grid container justifyContent='center' alignItems='center'>
          <Grid item xs={12} sm={10} md={8}>
            <CodeMirror
              height='500px' // Increase the height of the CodeMirror component
              value={editorCode}
              onChange={(newValue) => {
                setEditorCode(newValue);
              }}
              extensions={[basicSetup, qasm, oneDark]}
            />
          </Grid>
          <Grid item xs={12} my={5}>
            <Box display='flex' justifyContent='center'>
              <Button
                variant='contained'
                color='primary'
                onClick={runQuantumCircuit}>
                Run
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default App;
