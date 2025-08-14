import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  InputAdornment,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Person,
  Phone,
  Home,
  Pets,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';

function FarmerManagement() {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    num_cows: 1,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/farmers/read');
      setFarmers(response.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error(t('error') + ': ' + (error.response?.data?.detail || 'Failed to load farmers'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = t('required');
    }
    
    if (!formData.phone.trim()) {
      errors.phone = t('required');
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      errors.phone = t('invalidPhone');
    }
    
    if (!formData.address.trim()) {
      errors.address = t('required');
    }
    
    if (formData.num_cows < 1) {
      errors.num_cows = t('minimumAmount');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingFarmer) {
        // Update farmer
        await axios.put(`/farmers/update/${editingFarmer._id}`, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        });
        toast.success(t('farmerUpdated'));
      } else {
        // Create farmer
        await axios.post('/farmers/create', formData);
        toast.success(t('farmerAdded'));
      }
      
      setDialogOpen(false);
      setEditingFarmer(null);
      setFormData({ name: '', phone: '', address: '', num_cows: 1 });
      setFormErrors({});
      fetchFarmers();
    } catch (error) {
      console.error('Error saving farmer:', error);
      toast.error(t('error') + ': ' + (error.response?.data?.detail || 'Failed to save farmer'));
    }
  };

  const handleEdit = (farmer) => {
    setEditingFarmer(farmer);
    setFormData({
      name: farmer.name,
      phone: farmer.phone,
      address: farmer.address,
      num_cows: farmer.cows.length,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (farmerId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`/farmers/delete/${farmerId}`);
        toast.success(t('farmerDeleted'));
        fetchFarmers();
      } catch (error) {
        console.error('Error deleting farmer:', error);
        toast.error(t('error') + ': ' + (error.response?.data?.detail || 'Failed to delete farmer'));
      }
    }
  };

  const filteredFarmers = farmers.filter((farmer) =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone.includes(searchTerm)
  );

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFarmer(null);
    setFormData({ name: '', phone: '', address: '', num_cows: 1 });
    setFormErrors({});
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ marginBottom: 3, backgroundColor: '#FFF8DC', border: '2px solid #FFD700' }}>
        <CardContent>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ color: '#000000', fontWeight: 600, textAlign: 'center' }}
          >
            {t('farmerManagement')}
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#FFD700' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
                sx={{
                  backgroundColor: '#FFD700',
                  color: '#000000',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#E6C200',
                  },
                }}
                aria-label={t('addFarmer')}
              >
                {t('addFarmer')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ border: '2px solid #FFD700' }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FFD700' }}>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('farmerName')}
                  </TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('phone')}
                  </TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('address')}
                  </TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('cowCount')}
                  </TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFarmers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body1" sx={{ color: '#666666', padding: 3 }}>
                        {t('noDataAvailable')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFarmers.map((farmer) => (
                    <TableRow
                      key={farmer._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#FFF8DC',
                        },
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person sx={{ color: '#FFD700' }} />
                          <Typography sx={{ color: '#000000', fontWeight: 500 }}>
                            {farmer.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Phone sx={{ color: '#FFD700' }} />
                          <Typography sx={{ color: '#000000' }}>
                            {farmer.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Home sx={{ color: '#FFD700' }} />
                          <Typography sx={{ color: '#000000' }}>
                            {farmer.address}
                          </Typography>
                        </Box>
                      </TableCell>  
                      <TableCell>
                        <Chip
                          icon={<Pets />}
                          label={farmer.cows.length}
                          sx={{
                            backgroundColor: '#FFD700',
                            color: '#000000',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title={t('edit')}>
                            <IconButton
                              onClick={() => handleEdit(farmer)}
                              sx={{
                                color: '#FFD700',
                                '&:hover': {
                                  backgroundColor: '#FFF8DC',
                                },
                              }}
                              aria-label={`${t('edit')} ${farmer.name}`}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('delete')}>
                            <IconButton
                              onClick={() => handleDelete(farmer._id)}
                              sx={{
                                color: '#FF4444',
                                '&:hover': {
                                  backgroundColor: '#FFEBEE',
                                },
                              }}
                              aria-label={`${t('delete')} ${farmer.name}`}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            border: '2px solid #FFD700',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: '#FFD700',
            color: '#000000',
            fontWeight: 600,
          }}
        >
          {editingFarmer ? t('editFarmer') : t('addFarmer')}
        </DialogTitle>
        <DialogContent sx={{ padding: 3, backgroundColor: '#FFF8DC' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('farmerName')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#FFD700' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ marginTop: 1 }}
                aria-label={t('farmerName')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('phone')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: '#FFD700' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ marginTop: 1 }}
                aria-label={t('phone')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('address')}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                error={!!formErrors.address}
                helperText={formErrors.address}
                multiline
                rows={3}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home sx={{ color: '#FFD700' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ marginTop: 1 }}
                aria-label={t('address')}
              />
            </Grid>
            {!editingFarmer && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('numberOfCows')}
                  type="number"
                  value={formData.num_cows}
                  onChange={(e) => setFormData({ ...formData, num_cows: parseInt(e.target.value) || 1 })}
                  error={!!formErrors.num_cows}
                  helperText={formErrors.num_cows}
                  InputProps={{
                    inputProps: { min: 1 },
                    startAdornment: (
                      <InputAdornment position="start">
                        <Pets sx={{ color: '#FFD700' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ marginTop: 1 }}
                  aria-label={t('numberOfCows')}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ padding: 2, backgroundColor: '#FFF8DC' }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ color: '#666666' }}
            aria-label={t('cancel')}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#FFD700',
              color: '#000000',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#E6C200',
              },
            }}
            aria-label={t('save')}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FarmerManagement;