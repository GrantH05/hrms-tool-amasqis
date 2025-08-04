import * as terminationService from "../../services/hr/termination.services.js";
import { ObjectId } from "mongodb";

const terminationController = (socket, io) => {
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

  // Add termination
  socket.on("hr/termination/add", withRateLimit(async (data) => {
    try {
      const companyId = validateCompanyAccess();
      const { employeeId, terminationData } = data;
      const result = await terminationService.addTermination(companyId, employeeId, terminationData);
      socket.emit("hr/termination/add-response", result);
    } catch (error) {
      socket.emit("hr/termination/add-response", {
        done: false,
        error: error.message,
      });
    }
  }));

  // Edit termination
  socket.on("hr/termination/edit", withRateLimit(async (data) => {
    try {
      const companyId = validateCompanyAccess();
      const { employeeId, updateData } = data;
      const result = await terminationService.editTermination(companyId, employeeId, updateData);
      socket.emit("hr/termination/edit-response", result);
    } catch (error) {
      socket.emit("hr/termination/edit-response", {
        done: false,
        error: error.message,
      });
    }
  }));

  // Delete termination
  socket.on("hr/termination/delete", withRateLimit(async ({ employeeId }) => {
    try {
      const companyId = validateCompanyAccess();
      const result = await terminationService.deleteTermination(companyId, employeeId);
      socket.emit("hr/termination/delete-response", result);
    } catch (error) {
      socket.emit("hr/termination/delete-response", {
        done: false,
        error: error.message,
      });
    }
  }));

  // Finalize termination
  socket.on("hr/termination/finalize", async ({ employeeId }) => {
    try {
      const companyId = validateCompanyAccess();
      const result = await terminationService.finalizeTermination(companyId, employeeId);
      socket.emit("hr/termination/finalize-response", result);
    } catch (error) {
      socket.emit("hr/termination/finalize-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Bulk process expired terminations
  socket.on("hr/termination/process-expired", async () => {
    try {
      const companyId = validateCompanyAccess();
      const result = await terminationService.processExpiredTerminations(companyId);
      socket.emit("hr/termination/process-expired-response", result);
    } catch (error) {
      socket.emit("hr/termination/process-expired-response", {
        done: false,
        error: error.message,
      });
    }
  });

  // Get termination list
  socket.on("hr/termination/list", async (query) => {
    try {
      const companyId = validateCompanyAccess();
      const result = await terminationService.getTerminationList(companyId, query || {});
      socket.emit("hr/termination/list-response", result);
    } catch (error) {
      socket.emit("hr/termination/list-response", {
        done: false,
        error: error.message,
      });
    }
  });
};

export default terminationController;
