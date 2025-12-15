import { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, Stack, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, Checkbox, ListItemText, OutlinedInput, IconButton, Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = 'http://localhost:5051/api';

interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
}

interface Permission {
  id: number;
  name: string;
}

interface User {
  id: number;
  userName: string;
  roles?: Role[];
}

interface CarStatus {
  id: number;
  status: string;
}

interface Car {
  id: number;
  name: string;
  status: CarStatus;
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [carStatuses, setCarStatuses] = useState<CarStatus[]>([]);

  // Dialog states
  const [userDialog, setUserDialog] = useState<{ open: boolean; user?: User }>({ open: false });
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; role?: Role }>({ open: false });
  const [permDialog, setPermDialog] = useState<{ open: boolean; permission?: Permission }>({ open: false });
  const [carDialog, setCarDialog] = useState<{ open: boolean; car?: Car }>({ open: false });

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/Auth/login`, { userName, password });
      setToken(res.data.token);
    } catch {
      setError('Invalid credentials or server error');
    }
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [usersRes, rolesRes, permsRes, carsRes, statusesRes] = await Promise.all([
        axios.get(`${API_BASE}/User`, authHeaders),
        axios.get(`${API_BASE}/Role`, authHeaders),
        axios.get(`${API_BASE}/Permission`, authHeaders),
        axios.get(`${API_BASE}/Car`, authHeaders),
        axios.get(`${API_BASE}/Car/statuses`, authHeaders),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
      setCars(carsRes.data);
      setCarStatuses(statusesRes.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCarAction = async (carId: number, action: 'start' | 'stop') => {
    try {
      await axios.post(`${API_BASE}/Car/${carId}/${action}`, {}, authHeaders);
      fetchData();
    } catch {
      setError('Failed to update car status');
    }
  };

  // User CRUD
  const saveUser = async (data: { userName: string; password?: string; roleIds: number[] }, id?: number) => {
    try {
      if (id) {
        await axios.put(`${API_BASE}/User/${id}`, data, authHeaders);
      } else {
        await axios.post(`${API_BASE}/User`, data, authHeaders);
      }
      fetchData();
      setUserDialog({ open: false });
    } catch {
      setError('Failed to save user');
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    try {
      await axios.delete(`${API_BASE}/User/${id}`, authHeaders);
      fetchData();
    } catch {
      setError('Failed to delete user');
    }
  };

  // Role CRUD
  const saveRole = async (data: { name: string; permissionIds: number[] }, id?: number) => {
    try {
      if (id) {
        await axios.put(`${API_BASE}/Role/${id}`, data, authHeaders);
      } else {
        await axios.post(`${API_BASE}/Role`, data, authHeaders);
      }
      fetchData();
      setRoleDialog({ open: false });
    } catch {
      setError('Failed to save role');
    }
  };

  const deleteRole = async (id: number) => {
    if (!confirm('Delete this role?')) return;
    try {
      await axios.delete(`${API_BASE}/Role/${id}`, authHeaders);
      fetchData();
    } catch {
      setError('Failed to delete role');
    }
  };

  // Permission CRUD
  const savePermission = async (data: { name: string }, id?: number) => {
    try {
      if (id) {
        await axios.put(`${API_BASE}/Permission/${id}`, data, authHeaders);
      } else {
        await axios.post(`${API_BASE}/Permission`, data, authHeaders);
      }
      fetchData();
      setPermDialog({ open: false });
    } catch {
      setError('Failed to save permission');
    }
  };

  const deletePermission = async (id: number) => {
    if (!confirm('Delete this permission?')) return;
    try {
      await axios.delete(`${API_BASE}/Permission/${id}`, authHeaders);
      fetchData();
    } catch {
      setError('Failed to delete permission');
    }
  };

  // Car CRUD
  const saveCar = async (data: { name: string; statusId?: number }, id?: number) => {
    try {
      if (id) {
        await axios.put(`${API_BASE}/Car/${id}`, data, authHeaders);
      } else {
        await axios.post(`${API_BASE}/Car`, data, authHeaders);
      }
      fetchData();
      setCarDialog({ open: false });
    } catch {
      setError('Failed to save car');
    }
  };

  const deleteCar = async (id: number) => {
    if (!confirm('Delete this car?')) return;
    try {
      await axios.delete(`${API_BASE}/Car/${id}`, authHeaders);
      fetchData();
    } catch {
      setError('Failed to delete car');
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
    <Container maxWidth="lg">
      <Box mt={4} component={Paper} p={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Machine Emulator Dashboard</Typography>
          <Button variant="outlined" color="secondary" onClick={() => setToken(null)}>Logout</Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3 }}>
          <Tab label="Cars" />
          <Tab label="Users" />
          <Tab label="Roles" />
          <Tab label="Permissions" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Cars Tab */}
            {tabIndex === 0 && (
              <>
                <Stack direction="row" justifyContent="flex-end" mb={2}>
                  <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCarDialog({ open: true })}>
                    Add Car
                  </Button>
                </Stack>
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
                          <TableCell>
                            <Chip
                              label={car.status?.status || 'Unknown'}
                              color={car.status?.status === 'Running' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              sx={{ mr: 1 }}
                              disabled={car.status?.status === 'Running'}
                              onClick={() => handleCarAction(car.id, 'start')}
                            >
                              Start
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              sx={{ mr: 1 }}
                              disabled={car.status?.status === 'Stopped'}
                              onClick={() => handleCarAction(car.id, 'stop')}
                            >
                              Stop
                            </Button>
                            <IconButton onClick={() => setCarDialog({ open: true, car })}><EditIcon /></IconButton>
                            <IconButton onClick={() => deleteCar(car.id)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Users Tab */}
            {tabIndex === 1 && (
              <>
                <Stack direction="row" justifyContent="flex-end" mb={2}>
                  <Button startIcon={<AddIcon />} variant="contained" onClick={() => setUserDialog({ open: true })}>
                    Add User
                  </Button>
                </Stack>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell>Roles</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>{user.userName}</TableCell>
                          <TableCell>
                            {user.roles?.map(r => <Chip key={r.id} label={r.name} size="small" sx={{ mr: 0.5 }} />)}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton onClick={() => setUserDialog({ open: true, user })}><EditIcon /></IconButton>
                            <IconButton onClick={() => deleteUser(user.id)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Roles Tab */}
            {tabIndex === 2 && (
              <>
                <Stack direction="row" justifyContent="flex-end" mb={2}>
                  <Button startIcon={<AddIcon />} variant="contained" onClick={() => setRoleDialog({ open: true })}>
                    Add Role
                  </Button>
                </Stack>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Permissions</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roles.map(role => (
                        <TableRow key={role.id}>
                          <TableCell>{role.name}</TableCell>
                          <TableCell>
                            {role.permissions?.map(p => <Chip key={p.id} label={p.name} size="small" sx={{ mr: 0.5 }} />)}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton onClick={() => setRoleDialog({ open: true, role })}><EditIcon /></IconButton>
                            <IconButton onClick={() => deleteRole(role.id)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Permissions Tab */}
            {tabIndex === 3 && (
              <>
                <Stack direction="row" justifyContent="flex-end" mb={2}>
                  <Button startIcon={<AddIcon />} variant="contained" onClick={() => setPermDialog({ open: true })}>
                    Add Permission
                  </Button>
                </Stack>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {permissions.map(perm => (
                        <TableRow key={perm.id}>
                          <TableCell>{perm.name}</TableCell>
                          <TableCell align="right">
                            <IconButton onClick={() => setPermDialog({ open: true, permission: perm })}><EditIcon /></IconButton>
                            <IconButton onClick={() => deletePermission(perm.id)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}

        {/* User Dialog */}
        <UserDialog
          open={userDialog.open}
          user={userDialog.user}
          roles={roles}
          onClose={() => setUserDialog({ open: false })}
          onSave={saveUser}
        />

        {/* Role Dialog */}
        <RoleDialog
          open={roleDialog.open}
          role={roleDialog.role}
          permissions={permissions}
          onClose={() => setRoleDialog({ open: false })}
          onSave={saveRole}
        />

        {/* Permission Dialog */}
        <PermissionDialog
          open={permDialog.open}
          permission={permDialog.permission}
          onClose={() => setPermDialog({ open: false })}
          onSave={savePermission}
        />

        {/* Car Dialog */}
        <CarDialog
          open={carDialog.open}
          car={carDialog.car}
          statuses={carStatuses}
          onClose={() => setCarDialog({ open: false })}
          onSave={saveCar}
        />
      </Box>
    </Container>
  );
}

// User Dialog Component
function UserDialog({ open, user, roles, onClose, onSave }: {
  open: boolean;
  user?: User;
  roles: Role[];
  onClose: () => void;
  onSave: (data: { userName: string; password?: string; roleIds: number[] }, id?: number) => void;
}) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setUserName(user?.userName || '');
      setPassword('');
      setSelectedRoles(user?.roles?.map(r => r.id) || []);
    }
  }, [open, user]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? 'Edit User' : 'Add User'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Username"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label={user ? 'New Password (leave blank to keep)' : 'Password'}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required={!user}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Roles</InputLabel>
          <Select
            multiple
            value={selectedRoles}
            onChange={e => setSelectedRoles(e.target.value as number[])}
            input={<OutlinedInput label="Roles" />}
            renderValue={(selected) => roles.filter(r => selected.includes(r.id)).map(r => r.name).join(', ')}
          >
            {roles.map(role => (
              <MenuItem key={role.id} value={role.id}>
                <Checkbox checked={selectedRoles.includes(role.id)} />
                <ListItemText primary={role.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSave({ userName, password: password || undefined, roleIds: selectedRoles }, user?.id)}
          disabled={!userName || (!user && !password)}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Role Dialog Component
function RoleDialog({ open, role, permissions, onClose, onSave }: {
  open: boolean;
  role?: Role;
  permissions: Permission[];
  onClose: () => void;
  onSave: (data: { name: string; permissionIds: number[] }, id?: number) => void;
}) {
  const [name, setName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setName(role?.name || '');
      setSelectedPerms(role?.permissions?.map(p => p.id) || []);
    }
  }, [open, role]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{role ? 'Edit Role' : 'Add Role'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Role Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Permissions</InputLabel>
          <Select
            multiple
            value={selectedPerms}
            onChange={e => setSelectedPerms(e.target.value as number[])}
            input={<OutlinedInput label="Permissions" />}
            renderValue={(selected) => permissions.filter(p => selected.includes(p.id)).map(p => p.name).join(', ')}
          >
            {permissions.map(perm => (
              <MenuItem key={perm.id} value={perm.id}>
                <Checkbox checked={selectedPerms.includes(perm.id)} />
                <ListItemText primary={perm.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ name, permissionIds: selectedPerms }, role?.id)} disabled={!name}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Permission Dialog Component
function PermissionDialog({ open, permission, onClose, onSave }: {
  open: boolean;
  permission?: Permission;
  onClose: () => void;
  onSave: (data: { name: string }, id?: number) => void;
}) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName(permission?.name || '');
    }
  }, [open, permission]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{permission ? 'Edit Permission' : 'Add Permission'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Permission Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave({ name }, permission?.id)} disabled={!name}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Car Dialog Component
function CarDialog({ open, car, statuses, onClose, onSave }: {
  open: boolean;
  car?: Car;
  statuses: CarStatus[];
  onClose: () => void;
  onSave: (data: { name: string; statusId?: number }, id?: number) => void;
}) {
  const [name, setName] = useState('');
  const [statusId, setStatusId] = useState<number | ''>('');

  useEffect(() => {
    if (open) {
      setName(car?.name || '');
      setStatusId(car?.status?.id || '');
    }
  }, [open, car]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{car ? 'Edit Car' : 'Add Car'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Car Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            value={statusId}
            onChange={e => setStatusId(e.target.value as number)}
            label="Status"
          >
            {statuses.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.status}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSave({ name, statusId: statusId || undefined }, car?.id)}
          disabled={!name}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default App;
