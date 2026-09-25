"use client";

import { useActionState } from "react";
import { Info, Search, Users } from "lucide-react";

import { changeRoleAction, findMemberAction, type ControlRoomActionState, type FoundAccount } from "@/app/admin/actions";
import { ActionStatus, EmptyState, SectionGate, SectionPanel } from "@/components/control-room/shared";
import { useLanguage } from "@/components/language-provider";
import { RoleBadge, roleLabelKey } from "@/components/role-badge";
import { choiceFromRole, type RoleChoice, type SectionData } from "@/lib/control-room-validation";

export type TeamData = { members: FoundAccount[]; truncated: boolean };

const idleState: ControlRoomActionState = { status: "idle", message: "" };

function RoleOption({ choice }: { choice: RoleChoice }) {
  const { t } = useLanguage();
  return <option value={choice}>{choice === "none" ? t.crRoleNone : t[roleLabelKey(choice)]}</option>;
}

/** Picks a new role for one account. The server re-checks every rule; `choices` only shapes the menu. */
function RoleChangeForm({ account, showCurrent = false }: { account: FoundAccount; showCurrent?: boolean }) {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(changeRoleAction, idleState);
  // After a save the action returns the account with its new role and choices.
  const current = state.account?.id === account.id ? state.account : account;

  if (current.choices.length === 0) return <p className="cr-muted">{t.crRoleLocked}</p>;

  return (
    <form className="cr-inline-form" action={formAction}>
      <input type="hidden" name="userId" value={current.id} />
      {showCurrent && (
        <p className="cr-current-role">
          <span>{t.crRole}</span>
          {current.role ? <RoleBadge role={current.role} /> : <em>{t.crRoleNone}</em>}
        </p>
      )}
      <label>
        <span>{t.crChangeRole}</span>
        <select key={current.role ?? "none"} name="role" defaultValue={choiceFromRole(current.role)}>
          {current.choices.map((choice) => <RoleOption key={choice} choice={choice} />)}
        </select>
      </label>
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? t.crChangeRolePending : t.crChangeRoleIdle}
      </button>
      <ActionStatus state={state} />
    </form>
  );
}

function GiveRole() {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(findMemberAction, idleState);

  return (
    <SectionPanel id="cr-give-role-title" title="crGiveRoleTitle" desc="crGiveRoleDesc">
      <form className="cr-find-form" action={formAction}>
        <label>
          <span>{t.crFindLabel}</span>
          <input type="email" name="email" required maxLength={254} autoComplete="off" spellCheck={false} />
        </label>
        <button className="button button-secondary" type="submit" disabled={pending}>
          <Search aria-hidden="true" />
          {pending ? t.crFindPending : t.crFindIdle}
        </button>
      </form>
      <ActionStatus state={state} />
      {state.account && (
        <div className="cr-found">
          <div className="cr-found-identity">
            <strong>{state.account.name}</strong>
            <span>{state.account.email}</span>
          </div>
          <RoleChangeForm key={state.account.id} account={state.account} showCurrent />
        </div>
      )}
      <p className="cr-note">
        <Info aria-hidden="true" />
        <span>{t.crRoleNote}</span>
      </p>
    </SectionPanel>
  );
}

export function ControlRoomTeam({ viewerId, team }: { viewerId: string; team: SectionData<TeamData> }) {
  const { t } = useLanguage();

  return (
    <>
      <SectionPanel id="cr-team-title" title="crTeamTitle" desc="crTeamDesc">
        <SectionGate data={team}>
          {({ members, truncated }) => (
            <>
              {members.length === 0
                ? <EmptyState icon={Users} title="crTeamEmpty" desc="crTeamEmptyDesc" />
                : (
                  <table className="cr-table cr-team-table">
                    <thead>
                      <tr>
                        <th scope="col">{t.crName}</th>
                        <th scope="col">{t.accountEmail}</th>
                        <th scope="col">{t.crRole}</th>
                        <th scope="col"><span className="sr-only">{t.crChangeRole}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td data-label={t.crName}>
                            <span>
                              <strong>{member.name}</strong>
                              {member.id === viewerId && <span className="cr-you"> {t.crYou}</span>}
                            </span>
                          </td>
                          <td data-label={t.accountEmail} className="cr-break">{member.email}</td>
                          <td data-label={t.crRole}><RoleBadge role={member.role} /></td>
                          <td className="cr-manage-cell">
                            {member.choices.length > 0 && (
                              <details className="cr-manage">
                                <summary>{t.crChangeRole}</summary>
                                <RoleChangeForm account={member} />
                              </details>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              {truncated && <p className="cr-muted">{t.crTeamTruncated}</p>}
            </>
          )}
        </SectionGate>
      </SectionPanel>
      <GiveRole />
    </>
  );
}
