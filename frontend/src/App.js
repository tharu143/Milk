import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Container,
  Switch,
  FormControlLabel,
  IconButton,
  useMediaQuery
} from '@mui/material';
import {
  People,
  Opacity,
  Receipt,
  AccountBalance,
  Assessment,
  Language,
  Menu,
  Dashboard
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import FarmerManagement from './components/FarmerManagement';
import MilkCollection from './components/MilkCollection';
import Expenses from './components/Expenses';
import Advances from './components/Advances';
import Reports from './components/Reports';
import DashboardComponent from './components/Dashboard';
import BillGeneration from './components/BillGeneration';

// Add to menuItems array


// Create custom theme with royal yellow
const theme = createTheme({
  palette: {
    primary: {
      main: '#FFD700', // Royal Yellow
      contrastText: '#000000',
    },
    secondary: {
      main: '#FFA500', // Orange accent
      contrastText: '#000000',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#333333',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 600,
      color: '#000000',
    },
    h5: {
      fontWeight: 500,
      color: '#000000',
    },
    h6: {
      fontWeight: 500,
      color: '#000000',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFD700',
          color: '#000000',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#E6C200',
          },
          '&:focus': {
            boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '2px solid #FFD700',
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(255, 215, 0, 0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#FFD700',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#FFD700',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: '#FFD700',
            color: '#000000',
            '& .MuiListItemIcon-root': {
              color: '#000000',
            },
            '& .MuiListItemText-primary': {
              color: '#000000',
              fontWeight: 600,
            },
          },
          '&:hover': {
            backgroundColor: '#FFF8DC',
          },
        },
      },
    },
  },
});

const drawerWidth = 280;

function App() {
  const { t, i18n } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ta' : 'en');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: <Dashboard /> },
    { id: 'farmers', label: t('farmers'), icon: <People /> },
    { id: 'milkCollection', label: t('milkCollection'), icon: <Opacity /> },
    { id: 'expenses', label: t('expenses'), icon: <Receipt /> },
    { id: 'advances', label: t('advances'), icon: <AccountBalance /> },
    { id: 'reports', label: t('reports'), icon: <Assessment /> },
    { id: 'bills', label: t('bills'), icon: <Receipt /> },

// Add to renderContent switch

  ];

  const renderContent = () => {
    switch (selectedTab) {
      case 'dashboard':
        return <DashboardComponent />;
      case 'farmers':
        return <FarmerManagement />;
      case 'milkCollection':
        return <MilkCollection />;
      case 'expenses':
        return <Expenses />;
      case 'advances':
        return <Advances />;
      case 'reports':
        return <Reports />;
      default:
        return <DashboardComponent />;
        case 'bills':
  return <BillGeneration />;
    }
  };

  const drawer = (
    <div>
      <Toolbar
        sx={{
          backgroundColor: '#FFD700',
          color: '#000000',
          minHeight: '64px !important',
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
          {t('appTitle')}
        </Typography>
      </Toolbar>
      <List sx={{ padding: 0 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.id}
            selected={selectedTab === item.id}
            onClick={() => {
              setSelectedTab(item.id);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              padding: '12px 16px',
              margin: '4px 8px',
              borderRadius: '8px',
            }}
            aria-label={item.label}
          >
            <ListItemIcon sx={{ minWidth: '40px' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '1rem',
                  fontWeight: selectedTab === item.id ? 600 : 400,
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            backgroundColor: '#FFD700',
            color: '#000000',
            boxShadow: '0 2px 4px rgba(255, 215, 0, 0.3)',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <Menu />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, fontWeight: 600 }}
            >
              {menuItems.find(item => item.id === selectedTab)?.label || t('dashboard')}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={i18n.language === 'ta'}
                  onChange={toggleLanguage}
                  color="secondary"
                  inputProps={{ 'aria-label': t('language') }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Language />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {i18n.language === 'en' ? 'EN' : 'தமிழ்'}
                  </Typography>
                </Box>
              }
              labelPlacement="start"
              sx={{
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  color: '#000000',
                },
              }}
            />
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          aria-label="navigation menu"
        >
          <Drawer
            container={undefined}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '2px solid #FFD700',
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '2px solid #FFD700',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            backgroundColor: '#f5f5f5',
            minHeight: '100vh',
          }}
        >
          <Toolbar />
          <Container
            maxWidth="xl"
            sx={{
              padding: { xs: '16px', md: '24px' },
              marginTop: '16px',
            }}
          >
            <Box className="fade-in">
              {renderContent()}
            </Box>
          </Container>
        </Box>
      </Box>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          backgroundColor: '#FFF8DC',
          color: '#000000',
          border: '1px solid #FFD700',
        }}
      />
    </ThemeProvider>
  );
}

export default App;