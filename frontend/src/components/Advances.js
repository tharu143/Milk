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
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AccountBalance,
  Person,
  CalendarToday,
  AttachMoney,
  ExpandMore,
  History,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import moment from 'moment';

function Advances() {
  const { t } = useTranslation();
  const [advances, setAdvances] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [formData, setFormData] = useState({
    farmer_id: '',
    date: moment().format('YYYY-MM-DD'),
    amount_given: 0,
  });
  const [formErrors, setFormErrors] = useState({});
  const [filterFarmer, setFilterFarmer] = useState('');

  useEffect(() => {
    fetchAdvances();
    fetchFarmers();
  }, []);

  const fetchAdvances = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/advances/read');
      setAdvances(response.data);
    } catch (error) {
      console.error('Error fetching advances:', error);
      toast.error(t('error') + ': Failed to load advances');
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await axios.get('/farmers/read');
      setFarmers(response.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error(t('error') + ': Failed to load farmers');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.date) {
      errors.date = t('required');
    }
    
    if (!formData.farmer_id) {
      errors.farmer_id = t('pleaseSelectFarmer');
    }
    
    if (formData.amount_given <= 0) {
      errors.amount_given = t('pleaseEnterValidAmount');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingAdvance) {
        await axios.put(`/advances/update/${editingAdvance._id}`, {
          remaining: formData.remaining
        });
        toast.success(t('advanceUpdated'));
      } else {
        await axios.post('/advances/create', formData);
        toast.success(t('advanceGiven'));
      }
      
      setDialogOpen(false);
      setEditingAdvance(null);
      resetForm();
      fetchAdvances();
    } catch (error) {
      console.error('Error saving advance:', error);
      toast.error(t('error') + ': ' + (error.response?.data?.detail || 'Failed to save advance'));
    }
  };

  const handleEdit = (advance) => {
    setEditingAdvance(advance);
    setFormData({
      farmer_id: advance.farmer_id,
      date: advance.date,
      amount_given: advance.amount_given,
      remaining: advance.remaining,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (advanceId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await axios.delete(`/advances/delete/${advanceId}`);
        toast.success(t('advanceDeleted'));
        fetchAdvances();
      } catch (error) {
        console.error('Error deleting advance:', error);
        toast.error(t('error') + ': Failed to delete advance');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      farmer_id: '',
      date: moment().format('YYYY-MM-DD'),
      amount_given: 0,
    });
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAdvance(null);
    resetForm();
  };

  const filteredAdvances = filterFarmer 
    ? advances.filter(advance => advance.farmer_id === filterFarmer)
    : advances;

  const calculateTotalAdvances = () => {
    return filteredAdvances.reduce((sum, advance) => sum + advance.amount_given, 0);
  };

  const calculateTotalRemaining = () => {
    return filteredAdvances.reduce((sum, advance) => sum + advance.remaining, 0);
  };

  const getStatusColor = (remaining, amountGiven) => {
    if (remaining === 0) return '#4CAF50'; // Green for fully deducted
    if (remaining === amountGiven) return '#FF9800'; // Orange for not started
    return '#2196F3'; // Blue for partially deducted
  };

  const getStatusText = (remaining, amountGiven) => {
    if (remaining === 0) return 'Fully Deducted';
    if (remaining === amountGiven) return 'Pending';
    return 'Partially Deducted';
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
            {t('advanceManagement')}
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('farmer')}</InputLabel>
                <Select
                  value={filterFarmer}
                  onChange={(e) => setFilterFarmer(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                  }}
                >
                  <MenuItem value="">{t('allFarmers') || 'All Farmers'}</MenuItem>
                  {farmers.map((farmer) => (
                    <MenuItem key={farmer._id} value={farmer._id}>
                      {farmer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body1" sx={{ color: '#000000' }}>
                <strong>{t('totalAdvances')}:</strong> ₹{calculateTotalAdvances().toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body1" sx={{ color: '#000000' }}>
                <strong>{t('totalRemaining')}:</strong> ₹{calculateTotalRemaining().toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3} display="flex" justifyContent="flex-end">
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
              >
                {t('giveAdvance')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ border: '2px solid #FFD700' }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FFD700' }}>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('date')}
                  </TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('farmer')}
                  </TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('amountGiven')}
                  </TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('remaining')}
                  </TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ color: '#000000', fontWeight: 600 }}>
                    {t('actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAdvances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" sx={{ color: '#666666', padding: 3 }}>
                        {t('noDataAvailable')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdvances.map((advance) => (
                    <React.Fragment key={advance._id}>
                      <TableRow sx={{ '&:hover': { backgroundColor: '#FFF8DC' } }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarToday sx={{ color: '#FFD700' }} />
                            {moment(advance.date).format('DD/MM/YYYY')}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Person sx={{ color: '#FFD700' }} />
                            {advance.farmer_name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <AttachMoney sx={{ color: '#FFD700' }} />
                            <Typography sx={{ color: '#000000', fontWeight: 600 }}>
                              ₹{advance.amount_given.toFixed(2)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <AccountBalance sx={{ color: '#FFD700' }} />
                            <Typography sx={{ color: '#000000', fontWeight: 600 }}>
                              ₹{advance.remaining.toFixed(2)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(advance.remaining, advance.amount_given)}
                            sx={{
                              backgroundColor: getStatusColor(advance.remaining, advance.amount_given),
                              color: '#FFFFFF',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title={t('edit')}>
                              <IconButton
                                onClick={() => handleEdit(advance)}
                                sx={{ color: '#FFD700' }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('delete')}>
                              <IconButton
                                onClick={() => handleDelete(advance._id)}
                                sx={{ color: '#FF4444' }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      
                      {/* Deduction History */}
                      {advance.deduction_logs && advance.deduction_logs.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ padding: 0, backgroundColor: '#FFF8DC' }}>
                            <Accordion sx={{ boxShadow: 'none', border: 'none' }}>
                              <AccordionSummary
                                expandIcon={<ExpandMore />}
                                sx={{
                                  backgroundColor: 'transparent',
                                  minHeight: '40px',
                                  '& .MuiAccordionSummary-content': {
                                    margin: '8px 0',
                                  },
                                }}
                              >
                                <Box display="flex" alignItems="center" gap={1}>
                                  <History sx={{ color: '#FFD700' }} />
                                  <Typography variant="body2" sx={{ color: '#000000', fontWeight: 500 }}>
                                    {t('deductionHistory')} ({advance.deduction_logs.length} entries)
                                  </Typography>
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails sx={{ padding: '0 16px 16px' }}>
                                <List dense>
                                  {advance.deduction_logs.map((log, index) => (
                                    <ListItem key={index} sx={{ padding: '4px 0' }}>
                                      <ListItemText
                                        primary={`₹${log.amount_deducted.toFixed(2)}`}
                                        secondary={moment(log.date).format('DD/MM/YYYY')}
                                        sx={{
                                          '& .MuiListItemText-primary': {
                                            color: '#000000',
                                            fontWeight: 600,
                                          },
                                          '& .MuiListItemText-secondary': {
                                            color: '#666666',
                                          },
                                        }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </AccordionDetails>
                            </Accordion>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
        maxWidth="sm"
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
          {editingAdvance ? t('editAdvance') : t('giveAdvance')}
        </DialogTitle>
        <DialogContent sx={{ padding: 3, backgroundColor: '#FFF8DC' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('date')}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                error={!!formErrors.date}
                helperText={formErrors.date}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ color: '#FFD700' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ marginTop: 1 }}
                disabled={editingAdvance}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginTop: 1 }}>
                <InputLabel>{t('farmer')}</InputLabel>
                <Select
                  value={formData.farmer_id}
                  onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
                  error={!!formErrors.farmer_id}
                  disabled={editingAdvance}
                >
                  {farmers.map((farmer) => (
                    <MenuItem key={farmer._id} value={farmer._id}>
                      {farmer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {editingAdvance ? (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('remaining')}
                  type="number"
                  value={formData.remaining}
                  onChange={(e) => setFormData({ ...formData, remaining: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney sx={{ color: '#FFD700' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ marginTop: 1 }}
                />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('amountGiven')}
                  type="number"
                  value={formData.amount_given}
                  onChange={(e) => setFormData({ ...formData, amount_given: parseFloat(e.target.value) || 0 })}
                  error={!!formErrors.amount_given}
                  helperText={formErrors.amount_given}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney sx={{ color: '#FFD700' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ marginTop: 1 }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ padding: 2, backgroundColor: '#FFF8DC' }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#666666' }}>
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
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Advances;