import CallbackRequest from "../models/CallbackRequest.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * getCallbackRequests
 * GET /api/admin/callback-requests
 */
export const getCallbackRequests = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const total = await CallbackRequest.countDocuments(filter);
  const data = await CallbackRequest.find(filter)
    .populate("relatedProject", "title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    count: data.length,
    data,
  });
});

/**
 * updateCallbackStatus
 * PATCH /api/admin/callback-requests/:id/status
 */
export const updateCallbackStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["New", "Contacted", "Closed"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value",
    });
  }

  const callback = await CallbackRequest.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate("relatedProject", "title");

  if (!callback) {
    return res.status(404).json({
      success: false,
      message: "Callback request not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Callback status updated successfully",
    data: callback,
  });
});

/**
 * deleteCallbackRequest
 * DELETE /api/admin/callback-requests/:id
 */
export const deleteCallbackRequest = catchAsync(async (req, res) => {
  const { id } = req.params;

  const callback = await CallbackRequest.findByIdAndDelete(id);

  if (!callback) {
    return res.status(404).json({
      success: false,
      message: "Callback request not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Callback request deleted successfully",
  });
});
