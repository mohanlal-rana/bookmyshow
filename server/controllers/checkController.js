import Booking from "../models/bookingModel.js";

export const scanTicket = async (req, res) => {
  try {
    const { qrData } = req.body;

    const payload = JSON.parse(qrData);

    const { bookingId, ticketId } = payload;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    const ticket = booking.tickets.find(
      (t) => t.ticketId === ticketId
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Invalid ticket",
      });
    }

    if (ticket.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: "Ticket already used",
        checkedInAt: ticket.checkedInAt,
      });
    }

    ticket.isCheckedIn = true;
    ticket.checkedInAt = new Date();

    await booking.save();

    res.json({
      success: true,
      message: "Entry allowed",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};