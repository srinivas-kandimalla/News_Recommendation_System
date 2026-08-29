import { styled, alpha } from '@mui/material/styles';
import { AppBar, Toolbar, Box, InputBase, Button } from '@mui/material';

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.appBar,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: theme.shadows[2],
  borderBottom: `1px solid ${theme.palette.divider || theme.palette.border}`,
  color: theme.palette.text.primary,
}));

export const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  minHeight: 64,
  [theme.breakpoints.up('sm')]: {
    minHeight: 70,
  },
}));

export const SearchWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 4,
  backgroundColor: alpha(theme.palette.text.primary, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.text.primary, 0.08),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  transition: theme.transitions.create(['background-color', 'width'], {
    duration: theme.transitions.duration.shorter,
  }),
}));

export const SearchIconWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

export const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    fontFamily: theme.typography.body2.fontFamily,
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '28ch',
      },
    },
  },
}));

export const NavItemButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active }) => ({
  fontFamily: theme.typography.button.fontFamily,
  fontWeight: active ? 600 : 500,
  fontSize: theme.typography.button.fontSize,
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(1, 2),
  textTransform: 'none',
  position: 'relative',
  transition: theme.transitions.create(['color', 'background-color'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
  },
  ...(active && {
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 2,
      left: '20%',
      right: '20%',
      height: 2,
      borderRadius: 1,
      backgroundColor: theme.palette.primary.main,
    },
  }),
}));
