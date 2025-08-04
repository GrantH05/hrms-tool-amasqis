// resignation.services.js
import { ObjectId } from "mongodb";
import { getTenantCollections } from "../../config/db.js";

// Add a new resignation (to inprocessres)
export const addResignation = async (companyId, employeeId, resignationData) => {
  try {
    const collections = getTenantCollections(companyId);
    const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
    if (!employee) return { done: false, error: "Employee not found" };

    const inprocessresData = {
      ...employee,
      ...resignationData,
      employeeId: employee._id,
      createdAt: new Date(),
      status: "In Process",
    };

    await collections.inprocessres.insertOne(inprocessresData);
    return { done: true, data: inprocessresData };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Edit resignation request (update inprocessres)
export const editResignation = async (companyId, employeeId, updateData) => {
  try {
    const collections = getTenantCollections(companyId);
    const result = await collections.inprocessres.updateOne(
      { employeeId: new ObjectId(employeeId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return { done: false, error: "Resignation not found" };
    return { done: true };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Delete resignation from inprocessres or resignation
export const deleteResignation = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    await collections.inprocessres.deleteOne({ employeeId: new ObjectId(employeeId) });
    await collections.resignation.deleteOne({ employeeId: new ObjectId(employeeId) });
    return { done: true };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Finalize resignation: move from inprocessres to resignation, delete from employees
export const finalizeResignation = async (companyId, employeeId) => {
  try {
    const collections = getTenantCollections(companyId);
    const record = await collections.inprocessres.findOne({ employeeId: new ObjectId(employeeId) });
    if (!record) return { done: false, error: "inprocessres record not found" };

    const finalized = {
      ...record,
      finalizedAt: new Date(),
      status: record.type, // terminated / layoff / resigned
    };

    await Promise.all([
      collections.resignation.insertOne(finalized),
      collections.inprocessres.deleteOne({ employeeId: new ObjectId(employeeId) }),
      collections.employees.deleteOne({ _id: new ObjectId(employeeId) }),
    ]);

    return { done: true, data: finalized };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Auto finalize if notice period is over
export const processExpiredResignations = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    const now = new Date();
    const expired = await collections.inprocessres.find({ resignationDate: { $lte: now } }).toArray();

    const finalized = [];
    for (const entry of expired) {
      const res = await finalizeResignation(companyId, entry.employeeId);
      if (res.done) finalized.push(res.data);
    }

    return { done: true, data: finalized };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// Get all resignations (resignation + inprocessres) with search, sort, paginate
export const getResignationList = async (companyId, options = {}) => {
  const {
    search = "",
    sortBy = "resignationDate",
    sortOrder = "desc",
    page = 1,
    limit = 20,
    includeinprocessres = false,
  } = options;

  try {
    const collections = getTenantCollections(companyId);

    const query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const targetCollection = includeinprocessres ? collections.inprocessres : collections.resignation;

    const cursor = targetCollection.find(query).sort(sort).skip((page - 1) * limit).limit(limit);
    const [data, total] = await Promise.all([
      cursor.toArray(),
      targetCollection.countDocuments(query),
    ]);

    return { done: true, data, total, page };
  } catch (error) {
    return { done: false, error: error.message };
  }
};

