import { ObjectId } from "mongodb";
import { getTenantCollections } from "../../config/db.js";

// Add a new termination (to inprocesster)
export const addTermination = async (companyId, employeeId, terminationData) => {
  try {
    const collections = getTenantCollections(companyId);
    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) return { done: false, error: "Employee not found" };

    const inprocessterData = {
      ...employee,
      ...terminationData,
      employeeId: employee._id,
      createdAt: new Date(),
      type: "termination",
      terminationType: terminationData.terminationType || "standard",
      status: "In Process",
    };

    await collections.inprocesster.insertOne(inprocessterData);
    return { done: true, data: inprocessterData };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Edit termination request
export const editTermination = async (companyId, employeeId, updateData) => {
  try {
    const collections = getTenantCollections(companyId);
    const result = await collections.inprocesster.updateOne(
      { employeeId: new ObjectId(employeeId), type: "termination" },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return { done: false, error: "Termination record not found" };
    return { done: true };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Delete termination
export const deleteTermination = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    await collections.inprocesster.deleteOne({ employeeId: new ObjectId(employeeId), type: "termination" });
    await collections.termination.deleteOne({ employeeId: new ObjectId(employeeId), type: "termination" });
    return { done: true };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Finalize termination: move from inprocesster to termination collection
export const finalizeTermination = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    const record = await collections.inprocesster.findOne({ employeeId: new ObjectId(employeeId), type: "termination" });
    if (!record) return { done: false, error: "inprocesster record not found" };

    const finalized = {
      ...record,
      finalizedAt: new Date(),
      status: "terminated",
      terminationType: record.terminationType || "standard"
    };

    await Promise.all([
      collections.termination.insertOne(finalized),
      collections.inprocesster.deleteOne({ employeeId: new ObjectId(employeeId), type: "termination" }),
      collections.employees.deleteOne({ _id: new ObjectId(employeeId) }),
    ]);

    return { done: true, data: finalized };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Auto finalize expired termination notice periods
export const processExpiredTerminations = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    const now = new Date();
    const expired = await collections.inprocesster.find({
      resignationDate: { $lte: now },
      type: "termination"
    }).toArray();

    const finalized = [];
    for (const entry of expired) {
      const res = await finalizeTermination(companyId, entry.employeeId);
      if (res.done) finalized.push(res.data);
    }

    return { done: true, data: finalized };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Get termination list (active + in-process)
export const getTerminationList = async (companyId, options = {}) => {
  const {
    search = "",
    sortBy = "resignationDate",
    sortOrder = "desc",
    page = 1,
    limit = 20,
    includeinprocesster = false,
  } = options;

  try {
    const collections = getTenantCollections(companyId);

    const query = {
      type: "termination",
    };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const collection = includeinprocesster ? collections.inprocesster : collections.termination;
    const cursor = collection.find(query).sort(sort).skip((page - 1) * limit).limit(limit);

    const [data, total] = await Promise.all([
      cursor.toArray(),
      collection.countDocuments(query),
    ]);

    return { done: true, data, total, page };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

