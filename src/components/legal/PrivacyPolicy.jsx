import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { LegalList, LegalSection } from './LegalPage';
import {
    MINIMUM_AGE,
    PRIVACY_EFFECTIVE_DATE,
    SITE_NAME,
    SUBPROCESSORS,
} from '../../utils/legalConfig';

const PrivacyPolicy = ({ darkMode }) => (
    <LegalPage
        darkMode={darkMode}
        title="Privacy Policy"
        effectiveDate={PRIVACY_EFFECTIVE_DATE}
        summary={`We collect a username, an email address and a hashed password so you can sign in, plus the draft boards you choose to save. We do not sell your data, we do not run advertising, and you can delete everything yourself from your profile at any time.`}
    >
        <LegalSection darkMode={darkMode} id="who-we-are" title="Who this covers">
            <p>
                This policy explains what {SITE_NAME} does with personal information when you use
                the site at this domain. It applies to visitors and to people with accounts.
            </p>
            <p>
                You can use the draft board, draft range, lottery and every other tool without an
                account. Creating one is optional, and only adds the data described below.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="what-we-collect" title="What we collect">
            <p><strong>If you create an account:</strong></p>
            <LegalList>
                <li>
                    <strong>Username</strong> — chosen by you, and visible to you. It is not
                    published anywhere on the site today.
                </li>
                <li>
                    <strong>Email address</strong> — used to reset your password, confirm a new
                    account email and recover an email change you did not make. Nothing else.
                </li>
                <li>
                    <strong>Password</strong> — stored only as a bcrypt hash. We never store, log
                    or email your actual password, and nobody operating this site can read it.
                </li>
                <li>
                    <strong>Account timestamps</strong> — when the account was created and when it
                    was last used, so we can spot abuse and clean up dead accounts.
                </li>
                <li>
                    <strong>Saved boards</strong> — the tiers, ordering, tier names and flags for
                    any board you explicitly save. Player names, stats and photos are not stored
                    with your board; they are re-read from the public player database each time.
                </li>
            </LegalList>

            <p><strong>For everyone, with or without an account:</strong></p>
            <LegalList>
                <li>
                    <strong>Short-lived security identifiers</strong> — your IP address is used to
                    rate-limit signup, sign-in, password reset, sensitive account actions and board
                    writes. Normalized usernames or email addresses are also used as rate-limit keys
                    for sign-in and reset attempts. They are not linked to your browsing.
                </li>
                <li>
                    <strong>Aggregate page analytics</strong> — via Vercel Analytics, which counts
                    page views without cookies and without building a profile of you.
                </li>
                <li>
                    <strong>Data in your own browser</strong> — your working draft board, tier
                    names, backups and theme preference live in your browser's localStorage. That
                    is on your device, not our servers, and clearing your browser data erases it.
                </li>
            </LegalList>

            <p>
                We do not collect your real name, date of birth, address, phone number or payment
                details, because nothing here needs them.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="how-we-use-it" title="How we use it">
            <LegalList>
                <li>To sign you in and keep you signed in.</li>
                <li>To store and return the boards you asked us to save.</li>
                <li>To send you a temporary password when you ask to reset yours.</li>
                <li>To tell you when something security-relevant changes on your account.</li>
                <li>To stop brute-force attacks and abuse of the sign-up and reset forms.</li>
                <li>To understand roughly how many people use each tool, in aggregate.</li>
            </LegalList>
            <p>
                We do not use your information for advertising, and we do not build behavioural
                profiles.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="email" title="Email we send">
            <p>
                We only send transactional email: temporary passwords when you request a reset,
                confirmation links when you change your email, and recovery notices to the previous
                address after a confirmed change. There is no newsletter and no marketing list, so
                there is nothing to unsubscribe from. If you receive a password reset you did not
                request, you can ignore it — your existing password keeps working.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="cookies" title="Cookies and local storage">
            <p>
                We use one cookie: a session cookie that proves you are signed in. It is
                <code> httpOnly</code> (JavaScript cannot read it), <code>SameSite=Lax</code>, sent
                only over HTTPS in production, and expires after 30 days. It is strictly necessary
                for accounts to work, and it is not used for tracking. If you never sign in, you
                never receive it.
            </p>
            <p>
                Everything else the app remembers — your board, backups, dark mode, filters — is
                localStorage in your own browser, not a cookie, and it is never sent to us unless
                you save a board to your account.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="sharing" title="Who else sees your data">
            <p>
                We do not sell, rent or trade personal information. We share it only with the
                service providers that run the site:
            </p>
            <LegalList>
                {SUBPROCESSORS.map((processor) => (
                    <li key={processor.name}>
                        <strong>{processor.name}</strong> — {processor.role}.{' '}
                        <a
                            href={processor.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-500 hover:text-emerald-400"
                        >
                            Privacy policy
                        </a>
                    </li>
                ))}
            </LegalList>
            <p>
                We may also disclose information if we are legally required to, or where it is
                necessary to investigate abuse or protect someone's safety.
            </p>
            <p>
                If you use a share link, the board in that link is readable by anyone who has the
                link. Share links contain board data only — never your username, email or anything
                else about your account.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="retention" title="How long we keep it">
            <p>
                Account data and saved boards are kept until you delete them. Deleting your account
                removes your username, email, password hash and every saved board immediately and
                permanently — there is no recovery window, so export anything you want to keep
                first. Pending email changes expire after one hour, previous addresses used for
                recovery expire after 24 hours, and rate-limiting records become eligible for
                cleanup after 24 hours.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="your-rights" title="Your choices and rights">
            <p>Most of this is self-serve from your{' '}
                <Link to="/profile" className="font-semibold text-emerald-500 hover:text-emerald-400">
                    profile page
                </Link>:
            </p>
            <LegalList>
                <li><strong>See your data</strong> — your profile shows everything tied to your account.</li>
                <li><strong>Correct it</strong> — change your username or email at any time.</li>
                <li><strong>Export it</strong> — the Export/Import tool produces a copy of any board.</li>
                <li><strong>Delete it</strong> — "Delete account" removes everything, with no email to us required.</li>
            </LegalList>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="security" title="How we protect it">
            <p>
                Passwords are hashed with bcrypt at a work factor of 12 and are never stored in a
                readable form. Sessions are signed tokens in an httpOnly cookie, and changing your
                password invalidates every other signed-in device. All traffic is served over
                HTTPS. Sign-in and reset endpoints are rate-limited per account and per network.
            </p>
            <p>
                No system is perfectly secure. Use a password you do not use anywhere else, and
                tell us promptly if you think your account has been accessed by someone else.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="children" title="Children">
            <p>
                This site is not directed at children under {MINIMUM_AGE}, and we do not knowingly
                collect their information. Accounts and their saved data can be deleted immediately
                from the profile page.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="transfers" title="Where your data is processed">
            <p>
                Our providers operate globally and may process data in countries other than yours,
                including the United States. By using the site you understand your information may
                be handled in those locations under the safeguards those providers maintain.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="changes" title="Changes to this policy">
            <p>
                If this policy changes materially, we will update the effective date at the top.
                Continuing to use the site after a change means you accept the updated policy.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="related" title="Related">
            <p>
                See also our{' '}
                <Link to="/terms" className="font-semibold text-emerald-500 hover:text-emerald-400">
                    Terms of Service
                </Link>.
            </p>
        </LegalSection>
    </LegalPage>
);

export default PrivacyPolicy;
