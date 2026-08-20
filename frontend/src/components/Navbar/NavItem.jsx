import React from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { NavItemButton } from './navbar.styles';

const NavItem = ({ to, label, icon: Icon, onClick }) => {
  return (
    <RouterNavLink
      to={to}
      style={{ textDecoration: 'none' }}
      onClick={onClick}
    >
      {({ isActive }) => (
        <NavItemButton
          active={isActive ? 1 : 0}
          startIcon={Icon ? <Icon fontSize="small" /> : null}
        >
          {label}
        </NavItemButton>
      )}
    </RouterNavLink>
  );
};

export default NavItem;
