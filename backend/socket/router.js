import superAdminController from "../controllers/superadmin/superadmin.controller.js";
import adminController from "../controllers/admin/admin.controller.js";
import hrController from "../controllers/hr/hr.controller.js";

import employeeDashboardController from "../controllers/employee/employee.controller.js";

import pipelineController from "../controllers/pipeline/pipeline.controllers.js";


const router = (socket, io, role) => {
  console.log(`Setting up socket router for role: ${role}`);

  // Attach controllers immediately based on role
  switch (role) {
    case "superadmin":
      console.log("Attaching superadmin controller...");
      superAdminController(socket, io);
      break;
    case "admin":
      console.log("Attaching admin controller...");
      adminController(socket, io);
      pipelineController(socket, io);
      break;
    case "hr":
      console.log("Attaching hr controller...");
      hrController(socket, io);
      break;
    case "employee":
      console.log("Attaching employee controller...");       
      employeeDashboardController(socket, io);
      break;
    default:
      console.log(`No controller available for role: ${role}`);
      break;
  }

  socket.onAny((event, data) => {
    console.log(`[${socket.id}][${role}] Event: ${event}`);
  });
};

export default router;
