// components/ActionMenu.jsx
import React, { useState, useCallback, useMemo } from "react";
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  Divider,
  Radio,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  changeProductDepartment,
  changeProductSubDepartment,
  setNewSupervisor,
  setNewPriority,
} from "../../pages/Production/slice/productionChainSlice";
import { fetchActiveSubDepartments } from "../../pages/settings/slices/subDepartmentSlice";
import { useAuth } from "../../context/AuthContext";

function useSubmenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const openAt = useCallback((target) => setAnchorEl(target), []);
  const close = useCallback(() => setAnchorEl(null), []);
  return { anchorEl, open, openAt, close };
}

/* ----------------------- SWITCH DEPARTMENT SUBMENU ------------------------ */
const SwitchSubmenu = React.memo(function SwitchSubmenu({
  submenu,
  onSelect,
  departments,
  currentDepartment,
}) {
  const options = useMemo(() => departments || [], [departments]);

  return (
    <Menu
      anchorEl={submenu.anchorEl}
      open={submenu.open}
      onClose={submenu.close}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      disableAutoFocusItem
      MenuListProps={{ onClick: (e) => e.stopPropagation() }}
      sx={{ zIndex: 1400, marginLeft: "2px" }}
    >
      {options.map((opt) => (
        <MenuItem
          key={opt.id}
          disableRipple
          onClick={() => {
            onSelect(opt);
            submenu.close();
          }}
        >
          <Radio
            checked={currentDepartment === opt.id}
            sx={{ p: 0, pr: 1 }}
          />
          {opt.name}
        </MenuItem>
      ))}
    </Menu>
  );
});

/* ----------------------- SWITCH SUB-DEPARTMENT SUBMENU ------------------------ */
const SwitchSubDeptSubmenu = React.memo(function SwitchSubDeptSubmenu({
  submenu,
  onSelect,
  subDepartments,
  currentSubDepartment,
}) {
  const options = useMemo(() => subDepartments || [], [subDepartments]);

  return (
    <Menu
      anchorEl={submenu.anchorEl}
      open={submenu.open}
      onClose={submenu.close}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      disableAutoFocusItem
      MenuListProps={{ onClick: (e) => e.stopPropagation() }}
      sx={{ zIndex: 1400, marginLeft: "2px" }}
    >
      {options.length === 0 ? (
        <MenuItem disabled>No sub-processes available</MenuItem>
      ) : (
        options.map((opt) => (
          <MenuItem
            key={opt.id}
            disableRipple
            onClick={() => {
              onSelect(opt);
              submenu.close();
            }}
          >
            <Radio
              checked={currentSubDepartment === opt.id}
              sx={{ p: 0, pr: 1 }}
            />
            {opt.name}
          </MenuItem>
        ))
      )}
    </Menu>
  );
});

/* ----------------------- SUPERVISOR SUBMENU ------------------------ */
const SupervisorSubmenu = React.memo(function SupervisorSubmenu({
  submenu,
  supervisors,
  selected,
  onSelect,
}) {
  return (
    <Menu
      anchorEl={submenu.anchorEl}
      open={submenu.open}
      onClose={submenu.close}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      disableAutoFocusItem
      MenuListProps={{ onClick: (e) => e.stopPropagation() }}
      sx={{ zIndex: 1400, marginLeft: "2px" }}
    >
      {supervisors.length === 0 ? (
        <MenuItem disabled>None</MenuItem>
      ) : (
        supervisors.map((s) => (
          <MenuItem
            key={s.id}
            disableRipple
            onClick={() => {
              onSelect(s.id);
              submenu.close();
            }}
          >
            <Radio
              checked={selected === s.id}
              sx={{ padding: 0, paddingRight: 1 }}
            />
            {s.name}
          </MenuItem>
        ))
      )}
    </Menu>
  );
});

/* ----------------------- PRIORITY SUBMENU ------------------------ */
const PrioritySubmenu = React.memo(function PrioritySubmenu({
  submenu,
  value,
  onChange,
}) {
  const levels = ["High", "Medium", "Low"];
  return (
    <Menu
      anchorEl={submenu.anchorEl}
      open={submenu.open}
      onClose={submenu.close}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      disableAutoFocusItem
      MenuListProps={{ onClick: (e) => e.stopPropagation() }}
      sx={{ zIndex: 1400, marginLeft: "2px" }}
    >
      {levels.map((lvl) => (
        <MenuItem
          key={lvl}
          disableRipple
          onClick={() => {
            onChange(lvl);
            submenu.close();
          }}
        >
          <Radio
            checked={value === lvl}
            sx={{ padding: 0, paddingRight: 1 }}
          />
          {lvl}
        </MenuItem>
      ))}
    </Menu>
  );
});

/* ----------------------- MAIN ACTION MENU ------------------------ */
export default function ActionMenu({
  anchorEl,
  open,
  onClose,
  product,
  onOpenRequestStock,
  onOpenLogTime,
  onRefresh,
}) {
  const { hasPermission } = useAuth();
  const dispatch = useDispatch();
  const { data: departments = [] } = useSelector((state) => state.department);
  const { supervisor: supervisorData = [] } = useSelector((state) => state.user);
  // Read active sub-departments for the current department from Redux
  const { data: activeSubDepartments = [] } = useSelector((state) => state.subDepartment);


  const switchSub = useSubmenu();
  const switchSubDept = useSubmenu();   // ← new submenu hook for sub-dept
  const supSub = useSubmenu();
  const prioSub = useSubmenu();

  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [priority, setPriority] = useState("Not Set");

  /* ------------ Sync initial state when PRODUCT loads ------------- */
  React.useEffect(() => {
    if (product) {
      setSelectedSupervisor(product.supervisor_id || null);
      setPriority(product.priority || "Not Set");
    }
  }, [product]);

  /* ------------ Fetch active sub-departments whenever menu opens
     or the product's department changes ---------------------------- */
  React.useEffect(() => {
    if (open && product?.department_id) {
      dispatch(fetchActiveSubDepartments(product.department_id));
    }
  }, [open, product?.department_id, dispatch]);

  const closeAllSubmenus = useCallback(() => {
    switchSub.close();
    switchSubDept.close();
    supSub.close();
    prioSub.close();
  }, [switchSub, switchSubDept, supSub, prioSub]);

  /* ----------------------- UPDATE HANDLERS ----------------------- */
  const handleSwitchDepartment = useCallback(
    async (dept) => {
      if (!product) return;

      const res = await dispatch(
        changeProductDepartment({
          pp_id: product.id,
          department_id: dept.id,
        })
      );

      if (changeProductDepartment.fulfilled.match(res)) {
        if (onRefresh) await onRefresh();
        onClose();
        closeAllSubmenus();
      } else {
        console.error("Failed to update department:", res);
      }
    },
    [dispatch, product, onRefresh, onClose, closeAllSubmenus]
  );

  const handleSwitchSubDepartment = useCallback(
    async (subDept) => {
      if (!product) return;

      const res = await dispatch(
        changeProductSubDepartment({
          pp_id: product.id,
          sub_department_id: subDept.id,
        })
      );

      if (changeProductSubDepartment.fulfilled.match(res)) {
        if (onRefresh) await onRefresh();
        onClose();
        closeAllSubmenus();
      } else {
        console.error("Failed to update sub-process:", res);
      }
    },
    [dispatch, product, onRefresh, onClose, closeAllSubmenus]
  );

  const handleSupervisorChange = useCallback(
    async (id) => {
      setSelectedSupervisor(id);

      const res = await dispatch(
        setNewSupervisor({
          pp_id: product.id,
          supervisor_id: id,
        })
      );

      if (setNewSupervisor.fulfilled.match(res)) {
        if (onRefresh) await onRefresh();
        onClose();
        closeAllSubmenus();
      } else {
        console.error("Failed to update supervisor:", res);
      }
    },
    [dispatch, product, onRefresh, onClose, closeAllSubmenus]
  );

  const handlePriorityChange = useCallback(
    async (lvl) => {
      if (!product) return;

      setPriority(lvl);

      const res = await dispatch(
        setNewPriority({
          pp_id: product.id,
          priority: lvl,
        })
      );

      if (setNewPriority.fulfilled.match(res)) {
        if (onRefresh) await onRefresh();
        onClose();
        closeAllSubmenus();
      } else {
        console.error("Failed to update priority:", res);
      }
    },
    [dispatch, product, onRefresh, onClose, closeAllSubmenus]
  );

  const handleClose = useCallback(() => {
    onClose();
    closeAllSubmenus();
  }, [onClose, closeAllSubmenus]);

  const currentDeptName =
    departments.find((d) => d.id === product?.department_id)?.name || "-";

  // Resolve current sub-department name from the fetched active list
  const currentSubDeptName = useMemo(() => {
    if (!product?.sub_department_id) return null;
    return (
      activeSubDepartments.find((s) => s.id === product.sub_department_id)?.name || "-"
    );
  }, [activeSubDepartments, product?.sub_department_id]);

  const currentSupervisorName =
    supervisorData.find((s) => s.id === selectedSupervisor)?.name || "None";

  return (
    <>
      <Menu
        id="production-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              minWidth: 280,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* Transfer To (Switch Department) */}
        {hasPermission("productions.switch_to") && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              closeAllSubmenus();
              switchSub.openAt(e.currentTarget);
            }}
          >
            <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
              <Typography minWidth={90}>Transfer To:</Typography>
              <Typography fontWeight={600} fontSize={14}>
                {currentDeptName}
              </Typography>
            </Box>
          </MenuItem>
        )}

        {/* Sub-Department — only shown when product has a sub_department_id */}
        {hasPermission("productions.switch_to")  && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              closeAllSubmenus();
              switchSubDept.openAt(e.currentTarget);
            }}
          >
            <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
              <Typography minWidth={90} color="text.secondary" fontSize={14}>
                Sub-Process:
              </Typography>
              <Typography fontWeight={600} fontSize={14}>
                {currentSubDeptName}
              </Typography>
            </Box>
          </MenuItem>
        )}

        {/* Supervisor */}
        {hasPermission("productions.change_supervisor") && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              closeAllSubmenus();
              supSub.openAt(e.currentTarget);
            }}
          >
            <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
              <Typography minWidth={90}>Supervisor:</Typography>
              <Typography fontWeight={500} noWrap sx={{ maxWidth: 180, fontSize: 14 }}>
                {currentSupervisorName}
              </Typography>
            </Box>
          </MenuItem>
        )}

        {/* Priority */}
        {hasPermission("productions.change_priority") && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              closeAllSubmenus();
              prioSub.openAt(e.currentTarget);
            }}
          >
            <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
              <Typography minWidth={90}>Priority:</Typography>
              <Chip
                label={priority}
                size="small"
                color={
                  priority === "High"
                    ? "error"
                    : priority === "Medium"
                      ? "warning"
                      : "success"
                }
                sx={{ height: 24, fontSize: 12 }}
              />
            </Box>
          </MenuItem>
        )}

        {/* Log Time */}
        {hasPermission("productions.log_time") && (
          <MenuItem onClick={onOpenLogTime}>
            <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
              <Typography minWidth={90}>Log Time:</Typography>
              <Typography fontWeight={500} color="primary" fontSize={14}>
                Manage
              </Typography>
            </Box>
          </MenuItem>
        )}

        {hasPermission("productions.request_stock") && (
          <>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={onOpenRequestStock}>
              <Box display="flex" width="100%" justifyContent="center" alignItems="center">
                <Typography fontWeight={500} color="primary">
                  Request Stock
                </Typography>
                {product?.material_request?.length > 0 && (
                  <Chip
                    label={product.material_request.length}
                    size="small"
                    color="info"
                    sx={{ ml: 1, height: 20, fontSize: 11 }}
                  />
                )}
              </Box>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Submenus */}
      {hasPermission("productions.switch_to") && (
        <SwitchSubmenu
          submenu={switchSub}
          onSelect={handleSwitchDepartment}
          departments={departments}
          currentDepartment={product?.department_id}
        />
      )}

      {/* Sub-department submenu — only mounted when product has sub_department_id */}
      {hasPermission("productions.switch_to")  && (
        <SwitchSubDeptSubmenu
          submenu={switchSubDept}
          onSelect={handleSwitchSubDepartment}
          subDepartments={activeSubDepartments}
          currentSubDepartment={product?.sub_department_id}
        />
      )}

      {hasPermission("productions.change_supervisor") && (
        <SupervisorSubmenu
          submenu={supSub}
          supervisors={supervisorData}
          selected={selectedSupervisor}
          onSelect={handleSupervisorChange}
        />
      )}

      {hasPermission("productions.change_priority") && (
        <PrioritySubmenu
          submenu={prioSub}
          value={priority}
          onChange={handlePriorityChange}
        />
      )}
    </>
  );
}