import * as resignationService from "../../services/hr/resignation.services.js";
import { ObjectId } from "mongodb";

const resignationController = (socket, io) => {
  const isDevelopment =
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV !== "production";

  const validateCompanyAccess = () => {
    if (!socket.companyId) {
      throw new Error("Company ID not found in user metadata");
    }
    return socket.companyId;
  };

  const withRateLimit = (handler) => async (...args) => {
    if (isDevelopment || socket.checkRateLimit()) {
      return handler(...args);
    }
    const event = args[0] || "unknown";
    socket.emit(`${event}-response`, {
      done: false,
      error: "Rate limit exceeded. Try again later.",
    });
  };

  // Add resignation
  socket.on("hr/resignation/add", withRateLimit(async (data) => {
    try {
      const companyId = validateCompanyAccess();
      const { employeeId, resignationData } = data;
      const result = await resignationService.addResignation(companyId, employeeId, resignationData);
      socket.emit("hr/resignation/add-response", result);
    } catch (error) {
      socket.emit("hr/resignation/add-response", {
        done: false,
        error: error.message,
      });
    }
  }));

  // Edit resignation
  socket.on("hr/resignation/edit", withRateLimit(async (data) => {
    try {
      const companyId = validateCompanyAccess();
      const { employeeId, updateData } = data;
      const result = await resignationService.editResignation(companyId, employeeId, updateData);
      socket.emit("hr/resignation/edit-response", result);
    } catch (error) {
      socket.emit("hr/resignation/edit-response", {
        done: false,
        error: error.message,
      });
    }
  }));

  // Delete resignation
  socket.on("hr/resignation/delete", withRateLimit(async ({ employeeId }) => {
    try {
      const companyId = validateCompanyAccess();
      const result = await resignationService.deleteResignation(companyId, employeeId);
      socket.emit("hr/resignation/delete-response", result);
    } catch (error) {
      socket.emit("hr/resignation/delete-response", {
        done: false,
        error: error.message,
      });
    }
  }));

  // Finalize resignation (manual)
  socket.on("hr/resignation/finalize", async ({ employeeId }) => {
    try {
      const companyId = validateCompanyAccess();
      const result = await resignationService.finalizeResignation(companyId, employeeId);
      socket.emit("hr/resignation/finalize-response", result);
    } catch (error) {
      socket.emit("hr/resignation/finalize-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Bulk process expired resignations
  socket.on("hr/resignation/process-expired", async () => {
    try {
      const companyId = validateCompanyAccess();
      const result = await resignationService.processExpiredResignations(companyId);
      socket.emit("hr/resignation/process-expired-response", result);
    } catch (error) {
      socket.emit("hr/resignation/process-expired-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get resignation list
  socket.on("hr/resignation/list", async (query) => {
    try {
      const companyId = validateCompanyAccess();
      const result = await resignationService.getResignationList(companyId, query || {});
      socket.emit("hr/resignation/list-response", result);
    } catch (error) {
      socket.emit("hr/resignation/list-response", {
        done: false,
        error: error.message,
      });
    }
  });
};

export default resignationController;

