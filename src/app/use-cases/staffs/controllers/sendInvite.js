//const moment = require("moment");
//const { randomUUID } = require("crypto");
const Staff = require("../../../model/Staff");
const User = require("../../../model/User");
const Event = require("../../../model/Event");
//const { sendMail } = require("../../../mail/send-mail");

module.exports = {
  async sendInviteStaff(req, res) {
    try {
      const { phone, role } = req.body;
      const { event_id } = req.params;

      const current_user_id = req.user?.id;

      if (!phone) {
        return res
          .status(400)
          .send({ message: "Member phone is required." });
      }
      if (!event_id) {
        return res.status(400).send({ message: "Event id is required." });
      }
      if (!current_user_id) {
        return res.status(400).send({ message: "User id is required." });
      }
      if (!role) {
        return res.status(400).send({ message: "Role is required." });
      }

      const member = await User.findOne({ phone });
      if (!member) {
        return res
          .status(400)
          .send({ message: "Cannot found user with this phone." });
      }

      const user = await User.findOne({ _id: current_user_id });
      if (!user) {
        return res.status(400).send({ message: "Cannot found user." });
      }

      const event = await Event.findOne({ id: event_id })

      if (!event) {
        return res.status(400).send({ message: "Cannot found event." });
      }

      //const invite_token = randomUUID();
      //const invite_expires_at = moment().add("1", "h");

      const staff_member = await Staff.findOne({
        event: event._id,
        member: member._id,
      });

      if (staff_member) {
        return res
          .status(400)
          .send({ message: "This user is already a staff member." });
      }

      const staff_user = await Staff.findOne({
        event: event._id,
        member: user._id,
      });

      if (!staff_user) {
        return res
          .status(403)
          .send({ message: "You haven't permission to make this request." });
      }
      if (staff_user.role !== "manager") {
        return res
          .status(403)
          .send({ message: "You haven't permission to make this request." });
      }

      const new_staff = new Staff({
        event: event._id,
        role,
        member: member._id,
        tags: [
          member?.full_name,
          member?.phone,
          event?.name,
          event?.slug,
          event?.category,
          event?.address.location ?? 'Angola'
        ],
        invite: {
          status: "a",
          token: null,
          expires_at: null,
          sent_by: user._id,
        }
      });

      /* 

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
      
*/
      await new_staff.save();

      new_staff.event = event;
      new_staff.member = member;

      res.status(200).send({
        new_staff,
        message: "Colaborador(a) adicionado com sucesso!",
      });
    } catch (err) {
      console.error("error: ", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  },
};