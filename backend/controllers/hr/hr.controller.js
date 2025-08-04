import resignationController from "./resignation.controller.js";
import terminationController from "./termination.controller.js";

const modulefinder = (route) => {
  const parts = route.split("/");
  return parts.length > 1 ? parts[1] : null;
};

const hrController = (route, role, socket, io, attachedModules) => {
  socket.join("hr_room");
  const module = modulefinder(route);
  if (!module) return;

  if (!attachedModules.has(module)) {
    if (module === "resignation") {
      console.log("Attaching HR handlers for resignation...");
      resignationController(socket, io);
      attachedModules.add(module);
    } else if (module === "termination") {
      console.log("Attaching HR handlers for termination...");
      terminationController(socket, io);
      attachedModules.add(module);
    }
  }
};

export default hrController;

