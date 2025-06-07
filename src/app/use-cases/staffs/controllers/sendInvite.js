const moment = require("moment");
const { BadRequestError } = require("../../../error/bad-request-error");
const { ForbiddenError } = require("../../../error/forbidden-error");
const { NotFoundError } = require("../../../error/not-found-error");
const { randomUUID } = require("crypto");
const Staff = require("../../../entities/staff");
const User = require("../../../entities/user");
const { sendMail } = require("../../../mail/send-mail");

module.exports = {
  async sendInviteStaff(req, res) {
    try {
      const { member_email, event_id, current_user_id, mail, role } = req.body;

      if (!member_email) {
        throw new BadRequestError("Member email is required.");
      }
      if (!event_id) {
        throw new BadRequestError("Event id is required.");
      }
      if (!current_user_id) {
        throw new BadRequestError("Current user id is required.");
      }
      if (!role) {
        throw new BadRequestError("Role is required.");
      }

      const member = await User.findOne({ email: member_email });
      if (!member) {
        throw new BadRequestError("Cannot found user with this member email.");
      }

      const user = await User.findOne({ id: current_user_id });
      if (!user) {
        throw new BadRequestError("Something wrong.");
      }

      const event = await Event.findOne({ id: event_id });
      if (!event) {
        throw new NotFoundError("Cannot found event with this id.");
      }

      const invite_token = randomUUID();
      const invite_expires_at = moment().add("1", "h");

      const staff_member = await Staff.findOne({
        event: event._id,
        member: member._id,
      });

      if (staff_member) {
        throw new ForbiddenError(
          "This member already included in event staff."
        );
      }

      const staff_user = await Staff.findOne({
        event: event._id,
        member: user._id,
      });
      if (!staff_user) {
        throw new BadRequestError("Something wrong.");
      }
      if (staff_user.role !== "manager") {
        throw new ForbiddenError("You haven't permission to make this request.");
      }

      const new_staff = new Staff({
        event: event._id,
        role,
        member_id: member._id,
        invite_token,
        invite_expires_at,
      });

      await new_staff.save();

      const data_template_mail = {
        user: member,
        event: event,
        invite_token: invite_token,
        role,
        invite_expires_at: invite_expires_at.toString(),
        redirect_link: "https://piweto.ao/accept_invit/",
      };

      const mail_data = {
        to: member.email,
        from: "Piweto <suporte@piweto.ao>",
        subject: "Piweto | Convite para participar da organizacao do evento " + event.title,
        html: StaffInviteMailTemplate(data_template_mail),
        auth: {
          user: mail.auth.user,
          pass: mail.auth.pass,
        },
      };

      await sendMail(mail_data);

      res.status(200).send({
        message: "Invite sent successfully.",
      });
    } catch (err) {
      if (err instanceof BadRequestError) {
        res.status(400).send({ message: err.message });
      } else if (err instanceof ForbiddenError) {
        res.status(403).send({ message: err.message });
      } else if (err instanceof NotFoundError) {
        res.status(404).send({ message: err.message });
      } else {
        res.status(500).send({ message: err.message });
      }
    }
  },
};