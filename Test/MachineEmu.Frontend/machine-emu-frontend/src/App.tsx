import { useState, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TableSortLabel, CircularProgress, Stack, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, Checkbox, ListItemText, OutlinedInput, IconButton, Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { useConfirmDialog } from './components';

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

interface MotorcycleStatus {
  id: number;
  status: string;
}

interface Motorcycle {
  id: number;
  name: string;
  status: MotorcycleStatus;
}

function App() {
  const { confirm } = useConfirmDialog();
  const [token, setToken] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
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
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [motorcycleStatuses, setMotorcycleStatuses] = useState<MotorcycleStatus[]>([]);

  // Sorting states - default to first column ascending
  type Order = 'asc' | 'desc';
  const [carsSort, setCarsSort] = useState<{ orderBy: string; order: Order }>({ orderBy: 'name', order: 'asc' });
  const [motorcyclesSort, setMotorcyclesSort] = useState<{ orderBy: string; order: Order }>({ orderBy: 'name', order: 'asc' });
  const [usersSort, setUsersSort] = useState<{ orderBy: string; order: Order }>({ orderBy: 'userName', order: 'asc' });
  const [rolesSort, setRolesSort] = useState<{ orderBy: string; order: Order }>({ orderBy: 'name', order: 'asc' });
  const [permissionsSort, setPermissionsSort] = useState<{ orderBy: string; order: Order }>({ orderBy: 'name', order: 'asc' });

  // Sorting utility function
  const sortData = <T,>(data: T[], orderBy: string, order: Order): T[] => {
    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, orderBy);
      const bValue = getNestedValue(b, orderBy);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
      return order === 'asc' ? comparison : -comparison;
    });
  };

  const getNestedValue = (obj: any, path: string): any => {
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    // Handle arrays (e.g., roles) by joining their names for sorting
    if (Array.isArray(value)) {
      return value.map((item: any) => item.name || '').sort().join(', ');
    }
    return value;
  };

  const handleSort = (table: 'cars' | 'motorcycles' | 'users' | 'roles' | 'permissions', property: string) => {
    const setSort = { cars: setCarsSort, motorcycles: setMotorcyclesSort, users: setUsersSort, roles: setRolesSort, permissions: setPermissionsSort }[table];
    const currentSort = { cars: carsSort, motorcycles: motorcyclesSort, users: usersSort, roles: rolesSort, permissions: permissionsSort }[table];

    const isAsc = currentSort.orderBy === property && currentSort.order === 'asc';
    setSort({ orderBy: property, order: isAsc ? 'desc' : 'asc' });
  };

  // Dialog states
  const [userDialog, setUserDialog] = useState<{ open: boolean; user?: User }>({ open: false });
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; role?: Role }>({ open: false });
  const [permDialog, setPermDialog] = useState<{ open: boolean; permission?: Permission }>({ open: false });
  const [carDialog, setCarDialog] = useState<{ open: boolean; car?: Car }>({ open: false });
  const [motorcycleDialog, setMotorcycleDialog] = useState<{ open: boolean; motorcycle?: Motorcycle }>({ open: false });

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Permission helper functions
  const hasPermission = (permission: string) => userPermissions.includes(permission);
  const canManageUsers = () => hasPermission('ManageUsers');
  const canManageRoles = () => hasPermission('ManageRoles');
  const canManageCars = () => hasPermission('ManageCars');
  const canStartCar = () => hasPermission('StartCar');
  const canStopCar = () => hasPermission('StopCar');
  const canManageMotorcycles = () => hasPermission('ManageMotorcycles');
  const canStartMotorcycle = () => hasPermission('StartMotorcycle');
  const canStopMotorcycle = () => hasPermission('StopMotorcycle');
  const canDriveMotorcycle = () => hasPermission('DriveMotorcycle');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/Auth/login`, { userName, password });
      setToken(res.data.token);
      setUserPermissions(res.data.permissions || []);
    } catch {
      setError('Invalid credentials or server error');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserPermissions([]);
    setUsers([]);
    setRoles([]);
    setPermissions([]);
    setCars([]);
    setCarStatuses([]);
    setMotorcycles([]);
    setMotorcycleStatuses([]);
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Only fetch data the user has permission to access
      const requests: Promise<any>[] = [
        axios.get(`${API_BASE}/Car`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/Car/statuses`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/Motorcycle`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/Motorcycle/statuses`, authHeaders).catch(() => ({ data: [] })),
      ];

      if (hasPermission('ManageUsers')) {
        requests.push(axios.get(`${API_BASE}/User`, authHeaders).catch(() => ({ data: [] })));
      }
      if (hasPermission('ManageRoles')) {
        requests.push(axios.get(`${API_BASE}/Role`, authHeaders).catch(() => ({ data: [] })));
        requests.push(axios.get(`${API_BASE}/Permission`, authHeaders).catch(() => ({ data: [] })));
      }

      const results = await Promise.all(requests);
      setCars(results[0].data);
      setCarStatuses(results[1].data);
      setMotorcycles(results[2].data);
      setMotorcycleStatuses(results[3].data);

      let idx = 4;
      if (hasPermission('ManageUsers')) {
        setUsers(results[idx++].data);
      }
      if (hasPermission('ManageRoles')) {
        setRoles(results[idx++].data);
        setPermissions(results[idx++].data);
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token, userPermissions]);

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

  const handleMotorcycleAction = async (motorcycleId: number, action: 'start' | 'stop' | 'drive') => {
    try {
      await axios.post(`${API_BASE}/Motorcycle/${motorcycleId}/${action}`, {}, authHeaders);
      fetchData();
    } catch {
      setError('Failed to update motorcycle status');
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
    const confirmed = await confirm({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
    });
    if (!confirmed) return;
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
    const confirmed = await confirm({
      title: 'Delete Role',
      message: 'Are you sure you want to delete this role? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
    });
    if (!confirmed) return;
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
    const confirmed = await confirm({
      title: 'Delete Permission',
      message: 'Are you sure you want to delete this permission? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
    });
    if (!confirmed) return;
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
    const confirmed = await confirm({
      title: 'Delete Car',
      message: 'Are you sure you want to delete this car? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
    });
    if (!confirmed) return;
    try {
      await axios.delete(`${API_BASE}/Car/${id}`, authHeaders);
      fetchData();
    } catch {
      setError('Failed to delete car');
    }
  };

  // Motorcycle CRUD
  const saveMotorcycle = async (data: { name: string; statusId?: number }, id?: number) => {
    try {
      if (id) {
        await axios.put(`${API_BASE}/Motorcycle/${id}`, data, authHeaders);
      } else {
        await axios.post(`${API_BASE}/Motorcycle`, data, authHeaders);
      }
      fetchData();
      setMotorcycleDialog({ open: false });
    } catch {
      setError('Failed to save motorcycle');
    }
  };

  const deleteMotorcycle = async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Motorcycle',
      message: 'Are you sure you want to delete this motorcycle? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
    });
    if (!confirmed) return;
    try {
      await axios.delete(`${API_BASE}/Motorcycle/${id}`, authHeaders);
      fetchData();
    } catch {
      setError('Failed to delete motorcycle');
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
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip label={`Permissions: ${userPermissions.join(', ') || 'None'}`} size="small" variant="outlined" />
            <Button variant="outlined" color="secondary" onClick={handleLogout}>Logout</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3 }}>
          <Tab label="Cars" />
          <Tab label="Motorcycles" />
          {canManageUsers() && <Tab label="Users" />}
          {canManageRoles() && <Tab label="Roles" />}
          {canManageRoles() && <Tab label="Permissions" />}
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
                {canManageCars() && (
                  <Stack direction="row" justifyContent="flex-end" mb={2}>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCarDialog({ open: true })}>
                      Add Car
                    </Button>
                  </Stack>
                )}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sortDirection={carsSort.orderBy === 'name' ? carsSort.order : false}>
                          <TableSortLabel
                            active={carsSort.orderBy === 'name'}
                            direction={carsSort.orderBy === 'name' ? carsSort.order : 'asc'}
                            onClick={() => handleSort('cars', 'name')}
                          >
                            Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={carsSort.orderBy === 'status.status' ? carsSort.order : false}>
                          <TableSortLabel
                            active={carsSort.orderBy === 'status.status'}
                            direction={carsSort.orderBy === 'status.status' ? carsSort.order : 'asc'}
                            onClick={() => handleSort('cars', 'status.status')}
                          >
                            Status
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortData(cars, carsSort.orderBy, carsSort.order).map(car => (
                        <TableRow key={car.id}>
                          <TableCell>{car.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={car.status?.status || 'Unknown'}
                              color={car.status?.status === 'Running' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {canStartCar() && (
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
                            )}
                            {canStopCar() && (
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
                            )}
                            {canManageCars() && (
                              <>
                                <IconButton onClick={() => setCarDialog({ open: true, car })}><EditIcon /></IconButton>
                                <IconButton onClick={() => deleteCar(car.id)}><DeleteIcon /></IconButton>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Motorcycles Tab */}
            {tabIndex === 1 && (
              <>
                {canManageMotorcycles() && (
                  <Stack direction="row" justifyContent="flex-end" mb={2}>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={() => setMotorcycleDialog({ open: true })}>
                      Add Motorcycle
                    </Button>
                  </Stack>
                )}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sortDirection={motorcyclesSort.orderBy === 'name' ? motorcyclesSort.order : false}>
                          <TableSortLabel
                            active={motorcyclesSort.orderBy === 'name'}
                            direction={motorcyclesSort.orderBy === 'name' ? motorcyclesSort.order : 'asc'}
                            onClick={() => handleSort('motorcycles', 'name')}
                          >
                            Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={motorcyclesSort.orderBy === 'status.status' ? motorcyclesSort.order : false}>
                          <TableSortLabel
                            active={motorcyclesSort.orderBy === 'status.status'}
                            direction={motorcyclesSort.orderBy === 'status.status' ? motorcyclesSort.order : 'asc'}
                            onClick={() => handleSort('motorcycles', 'status.status')}
                          >
                            Status
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortData(motorcycles, motorcyclesSort.orderBy, motorcyclesSort.order).map(motorcycle => (
                        <TableRow key={motorcycle.id}>
                          <TableCell>{motorcycle.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={motorcycle.status?.status || 'Unknown'}
                              color={motorcycle.status?.status === 'Running' ? 'success' : motorcycle.status?.status === 'Driving' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {canStartMotorcycle() && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                sx={{ mr: 1 }}
                                disabled={motorcycle.status?.status === 'Running' || motorcycle.status?.status === 'Driving'}
                                onClick={() => handleMotorcycleAction(motorcycle.id, 'start')}
                              >
                                Start
                              </Button>
                            )}
                            {canDriveMotorcycle() && (
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                sx={{ mr: 1 }}
                                disabled={motorcycle.status?.status !== 'Running'}
                                onClick={() => handleMotorcycleAction(motorcycle.id, 'drive')}
                              >
                                Drive
                              </Button>
                            )}
                            {canStopMotorcycle() && (
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                sx={{ mr: 1 }}
                                disabled={motorcycle.status?.status === 'Stopped'}
                                onClick={() => handleMotorcycleAction(motorcycle.id, 'stop')}
                              >
                                Stop
                              </Button>
                            )}
                            {canManageMotorcycles() && (
                              <>
                                <IconButton onClick={() => setMotorcycleDialog({ open: true, motorcycle })}><EditIcon /></IconButton>
                                <IconButton onClick={() => deleteMotorcycle(motorcycle.id)}><DeleteIcon /></IconButton>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Users Tab - Only shown for users with ManageUsers permission */}
            {tabIndex === 2 && canManageUsers() && (
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
                        <TableCell sortDirection={usersSort.orderBy === 'userName' ? usersSort.order : false}>
                          <TableSortLabel
                            active={usersSort.orderBy === 'userName'}
                            direction={usersSort.orderBy === 'userName' ? usersSort.order : 'asc'}
                            onClick={() => handleSort('users', 'userName')}
                          >
                            Username
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={usersSort.orderBy === 'roles' ? usersSort.order : false}>
                          <TableSortLabel
                            active={usersSort.orderBy === 'roles'}
                            direction={usersSort.orderBy === 'roles' ? usersSort.order : 'asc'}
                            onClick={() => handleSort('users', 'roles')}
                          >
                            Roles
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortData(users, usersSort.orderBy, usersSort.order).map(user => (
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

            {/* Roles Tab - Only shown for users with ManageRoles permission */}
            {tabIndex === 3 && canManageRoles() && (
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
                        <TableCell sortDirection={rolesSort.orderBy === 'name' ? rolesSort.order : false}>
                          <TableSortLabel
                            active={rolesSort.orderBy === 'name'}
                            direction={rolesSort.orderBy === 'name' ? rolesSort.order : 'asc'}
                            onClick={() => handleSort('roles', 'name')}
                          >
                            Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Permissions</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortData(roles, rolesSort.orderBy, rolesSort.order).map(role => (
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

            {/* Permissions Tab - Only shown for users with ManageRoles permission */}
            {tabIndex === 4 && canManageRoles() && (
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
                        <TableCell sortDirection={permissionsSort.orderBy === 'name' ? permissionsSort.order : false}>
                          <TableSortLabel
                            active={permissionsSort.orderBy === 'name'}
                            direction={permissionsSort.orderBy === 'name' ? permissionsSort.order : 'asc'}
                            onClick={() => handleSort('permissions', 'name')}
                          >
                            Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortData(permissions, permissionsSort.orderBy, permissionsSort.order).map(perm => (
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

        {/* Motorcycle Dialog */}
        <MotorcycleDialog
          open={motorcycleDialog.open}
          motorcycle={motorcycleDialog.motorcycle}
          statuses={motorcycleStatuses}
          onClose={() => setMotorcycleDialog({ open: false })}
          onSave={saveMotorcycle}
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

// Motorcycle Dialog Component
function MotorcycleDialog({ open, motorcycle, statuses, onClose, onSave }: {
  open: boolean;
  motorcycle?: Motorcycle;
  statuses: MotorcycleStatus[];
  onClose: () => void;
  onSave: (data: { name: string; statusId?: number }, id?: number) => void;
}) {
  const [name, setName] = useState('');
  const [statusId, setStatusId] = useState<number | ''>('');

  useEffect(() => {
    if (open) {
      setName(motorcycle?.name || '');
      setStatusId(motorcycle?.status?.id || '');
    }
  }, [open, motorcycle]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{motorcycle ? 'Edit Motorcycle' : 'Add Motorcycle'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Motorcycle Name"
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
          onClick={() => onSave({ name, statusId: statusId || undefined }, motorcycle?.id)}
          disabled={!name}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default App;
