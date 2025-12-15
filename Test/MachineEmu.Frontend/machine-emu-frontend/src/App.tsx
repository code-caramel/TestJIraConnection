
import { useState, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Stack } from '@mui/material';
import axios from 'axios';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [carError, setCarError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5051/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, password })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      setToken(data.token);
    } catch (err) {
      setError('Invalid credentials or server error');
    }
  };

  useEffect(() => {
    if (token) {
      setLoading(true);
      setCarError('');
      axios.get('http://localhost:5051/api/Car', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : [];
          setCars(data);
        })
        .catch(() => setCarError('Failed to load cars'))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleCarAction = async (carId: number, action: 'start' | 'stop') => {
    setLoading(true);
    setCarError('');
    try {
      await axios.post(`http://localhost:5051/api/Car/${carId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh car list
      const res = await axios.get('http://localhost:5051/api/Car', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setCars(data);
    } catch {
      setCarError('Failed to update car status');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container maxWidth="sm">
        <Box mt={8} component={Paper} p={4}>
          <Typography variant="h5" mb={2}>Login</Typography>
          <form onSubmit={handleLogin}>
            <TextField
              label="Username"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
              Login
            </Button>
          </form>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={8} component={Paper} p={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Car Dashboard</Typography>
          <Button variant="outlined" color="secondary" onClick={() => setToken(null)}>Logout</Button>
        </Stack>
        {carError && <Alert severity="error" sx={{ mb: 2 }}>{carError}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cars.map(car => (
                  <TableRow key={car.id}>
                    <TableCell>{car.name}</TableCell>
                    <TableCell>{car.status?.status || 'Unknown'}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        sx={{ mr: 1 }}
                        disabled={car.status?.status === 'Running' || loading}
                        onClick={() => handleCarAction(car.id, 'start')}
                      >
                        Start
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        disabled={car.status?.status === 'Stopped' || loading}
                        onClick={() => handleCarAction(car.id, 'stop')}
                      >
                        Stop
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}

export default App;
