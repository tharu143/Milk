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
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel
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

// Define multiple themes
const themes = {
  golden_black: createTheme({
    palette: {
      primary: { main: '#FFD700', contrastText: '#000000' },
      secondary: { main: '#FFA500', contrastText: '#000000' },
      background: { default: '#FFFFFF', paper: '#F5F5F5' },
      text: { primary: '#000000', secondary: '#333333' },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      h4: { fontWeight: 600, color: '#000000' },
      h5: { fontWeight: 500, color: '#000000' },
      h6: { fontWeight: 500, color: '#000000' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            backgroundColor: '#FFD700',
            color: '#000000',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#E6C200' },
            '&:focus': { boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.3)' },
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
              '&.Mui-focused fieldset': { borderColor: '#FFD700' },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#FFD700' },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: '#FFD700',
              color: '#000000',
              '& .MuiListItemIcon-root': { color: '#000000' },
              '& .MuiListItemText-primary': { color: '#000000', fontWeight: 600 },
            },
            '&:hover': { backgroundColor: '#FFF8DC' },
          },
        },
      },
    },
  }),
  lightgreen_white: createTheme({
    palette: {
      primary: { main: '#8BC34A', contrastText: '#000000' },
      secondary: { main: '#4CAF50', contrastText: '#000000' },
      background: { default: '#FFFFFF', paper: '#F5F5F5' },
      text: { primary: '#000000', secondary: '#333333' },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      h4: { fontWeight: 600, color: '#000000' },
      h5: { fontWeight: 500, color: '#000000' },
      h6: { fontWeight: 500, color: '#000000' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            backgroundColor: '#8BC34A',
            color: '#000000',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#7CB342' },
            '&:focus': { boxShadow: '0 0 0 3px rgba(139, 195, 74, 0.3)' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: '2px solid #8BC34A',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(139, 195, 74, 0.2)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': { borderColor: '#8BC34A' },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#8BC34A' },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: '#8BC34A',
              color: '#000000',
              '& .MuiListItemIcon-root': { color: '#000000' },
              '& .MuiListItemText-primary': { color: '#000000', fontWeight: 600 },
            },
            '&:hover': { backgroundColor: '#F5F5F5' },
          },
        },
      },
    },
  }),
  simple: createTheme({
    palette: {
      primary: { main: '#2196F3', contrastText: '#FFFFFF' },
      secondary: { main: '#FF5722', contrastText: '#FFFFFF' },
      background: { default: '#F5F5F5', paper: '#FFFFFF' },
      text: { primary: '#000000', secondary: '#333333' },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      h4: { fontWeight: 600, color: '#000000' },
      h5: { fontWeight: 500, color: '#000000' },
      h6: { fontWeight: 500, color: '#000000' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            backgroundColor: '#2196F3',
            color: '#FFFFFF',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#1976D2' },
            '&:focus': { boxShadow: '0 0 0 3px rgba(33, 150, 243, 0.3)' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: '2px solid #2196F3',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(33, 150, 243, 0.2)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': { borderColor: '#2196F3' },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#2196F3' },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: '#2196F3',
              color: '#FFFFFF',
              '& .MuiListItemIcon-root': { color: '#FFFFFF' },
              '& .MuiListItemText-primary': { color: '#FFFFFF', fontWeight: 600 },
            },
            '&:hover': { backgroundColor: '#E3F2FD' },
          },
        },
      },
    },
  }),
};

const drawerWidth = 280;

function App() {
  const { t, i18n } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(themes.golden_black.breakpoints.down('md'));
  const [currentTheme, setCurrentTheme] = useState('golden_black');

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ta' : 'en');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleThemeChange = (event) => {
    setCurrentTheme(event.target.value);
  };

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: <Dashboard /> },
    { id: 'farmers', label: t('farmers'), icon: <People /> },
    { id: 'milkCollection', label: t('milkCollection'), icon: <Opacity /> },
    { id: 'expenses', label: t('expenses'), icon: <Receipt /> },
    { id: 'advances', label: t('advances'), icon: <AccountBalance /> },
    { id: 'reports', label: t('reports'), icon: <Assessment /> },
    { id: 'bills', label: t('bills'), icon: <Receipt /> },
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
      case 'bills':
        return <BillGeneration />;
      default:
        return <DashboardComponent />;
    }
  };

  const drawer = (
    <div>
      <Toolbar
        sx={{
          backgroundColor: themes[currentTheme].palette.primary.main,
          color: themes[currentTheme].palette.primary.contrastText,
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
    <ThemeProvider theme={themes[currentTheme]}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            backgroundColor: themes[currentTheme].palette.primary.main,
            color: themes[currentTheme].palette.primary.contrastText,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
            <FormControl sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel sx={{ color: themes[currentTheme].palette.primary.contrastText }}>Theme</InputLabel>
              <Select
                value={currentTheme}
                onChange={handleThemeChange}
                label="Theme"
                sx={{
                  color: themes[currentTheme].palette.primary.contrastText,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: themes[currentTheme].palette.primary.contrastText },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themes[currentTheme].palette.primary.contrastText },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themes[currentTheme].palette.primary.contrastText },
                }}
              >
                <MenuItem value="golden_black">Golden + Black</MenuItem>
                <MenuItem value="lightgreen_white">Light Green + White</MenuItem>
                <MenuItem value="simple">Simple</MenuItem>
              </Select>
            </FormControl>
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
                  color: themes[currentTheme].palette.primary.contrastText,
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
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: `2px solid ${themes[currentTheme].palette.primary.main}`,
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
                borderRight: `2px solid ${themes[currentTheme].palette.primary.main}`,
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
            backgroundColor: themes[currentTheme].palette.background.default,
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
          backgroundColor: themes[currentTheme].palette.background.paper,
          color: themes[currentTheme].palette.text.primary,
          border: `1px solid ${themes[currentTheme].palette.primary.main}`,
        }}
      />
    </ThemeProvider>
  );
}

export default App;