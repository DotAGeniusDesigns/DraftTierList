import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { LegalList, LegalSection } from './LegalPage';
import {
    MINIMUM_AGE,
    SITE_NAME,
    TERMS_EFFECTIVE_DATE,
} from '../../utils/legalConfig';

const TermsOfService = ({ darkMode }) => (
    <LegalPage
        darkMode={darkMode}
        title="Terms of Service"
        effectiveDate={TERMS_EFFECTIVE_DATE}
        summary={`${SITE_NAME} is a free fantasy football tool provided as-is. Keep your account secure, do not abuse the service, and understand that draft rankings and projections are opinions — not guarantees about how any player will perform.`}
    >
        <LegalSection darkMode={darkMode} id="acceptance" title="1. Accepting these terms">
            <p>
                By using {SITE_NAME} you agree to these terms. If you do not agree with them, please
                do not use the site. If you use it on behalf of a league or organisation, you
                confirm you are allowed to accept these terms for them.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="service" title="2. What the service is">
            <p>
                {SITE_NAME} provides draft preparation tools: tier lists, draft ranges, streaming
                suggestions, a draft lottery, offseason information and optional live draft sync
                with Sleeper. Most features work without an account. An account adds the ability to
                save boards to our servers and access them from other devices.
            </p>
            <p>
                We may add, change or remove features at any time. We may also suspend the service
                for maintenance, or discontinue it entirely, without liability to you.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="eligibility" title="3. Who can use it">
            <p>
                You must be at least {MINIMUM_AGE} years old to create an account. If you are under
                the age of majority where you live, you may only use the service with the
                involvement of a parent or guardian.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="accounts" title="4. Your account">
            <LegalList>
                <li>Give accurate information, including a real email address you control.</li>
                <li>Keep your password secret. You are responsible for what happens under your account.</li>
                <li>Do not share your account, and do not use anyone else's.</li>
                <li>If you suspect unauthorised access, change your password and sign out every other session from your profile.</li>
                <li>One person, one account. Do not create accounts in bulk or by automated means.</li>
            </LegalList>
            <p>
                You can delete your account at any time from your{' '}
                <Link to="/profile" className="font-semibold text-emerald-500 hover:text-emerald-400">
                    profile page
                </Link>. We may suspend or terminate accounts that breach these terms, or that we
                reasonably believe are being used to harm the service or other users.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="your-content" title="5. Your boards and content">
            <p>
                Your draft boards, tier names and rankings are yours. You keep all rights to them.
                You grant us only the narrow permission needed to run the service: to store your
                saved boards, and to display them back to you and to anyone you deliberately send a
                share link to.
            </p>
            <p>
                You are responsible for the content you enter. Do not put anything unlawful,
                harassing, hateful or infringing into a tier name or board you share. We may remove
                content that breaches these terms.
            </p>
            <p>
                Anyone holding a share link can see the board it encodes. Only share links with
                people you intend to see that board.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="acceptable-use" title="6. Acceptable use">
            <p>Do not:</p>
            <LegalList>
                <li>Break into, probe or disrupt the service, its infrastructure or other users' accounts.</li>
                <li>Scrape, spider or bulk-download the site beyond ordinary personal use.</li>
                <li>Automate requests in a way that degrades the service for other people.</li>
                <li>Work around rate limits, authentication or any other technical restriction.</li>
                <li>Resell, sublicense or commercially redistribute the service or its data.</li>
                <li>Use the service to break any law, or the rules of any league or platform you participate in.</li>
                <li>Impersonate anyone, or misrepresent your affiliation with a person or organisation.</li>
            </LegalList>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="third-party" title="7. Third-party data and services">
            <p>
                Player data, rankings, injury reports and projections come from public sources and
                third-party providers. Live draft sync depends on Sleeper's public API and is
                subject to their availability and their terms. We are not affiliated with, endorsed
                by, or sponsored by the National Football League, any NFL team, Sleeper, ESPN,
                Yahoo, or any other fantasy platform. All team names, logos and player names are
                the property of their respective owners and are used for identification only.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="no-warranty" title="8. No warranty">
            <p>
                The service is provided "as is" and "as available", without warranties of any kind,
                whether express or implied, including any implied warranties of merchantability,
                fitness for a particular purpose, or non-infringement.
            </p>
            <p>
                We do not warrant that the service will be uninterrupted, error-free or secure, or
                that player data, rankings, ADP, injury information or projections are accurate,
                complete or current. <strong>Rankings and projections are opinions.</strong> They are
                not predictions you should rely on for anything with money at stake, and we make no
                promise about how any player, team or draft will actually turn out.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="liability" title="9. Limitation of liability">
            <p>
                To the fullest extent permitted by law, {SITE_NAME} and anyone involved in
                operating it will not be liable for any indirect, incidental, special,
                consequential or punitive damages, or for any loss of data, profits, or fantasy
                league standing, arising out of your use of or inability to use the service — even
                if we have been advised such damages are possible.
            </p>
            <p>
                Because the service is provided free of charge, our total liability to you for any
                claim relating to the service is limited to one hundred US dollars ($100).
            </p>
            <p>
                Some jurisdictions do not allow certain limitations, so parts of this section may
                not apply to you. Nothing here limits liability that cannot lawfully be limited.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="data-loss" title="10. Backups are your responsibility">
            <p>
                We take reasonable care with saved boards but do not guarantee against data loss.
                Deleting your account erases your saved boards immediately and permanently. Use the
                Export tool to keep your own copy of anything you would be upset to lose.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="indemnity" title="11. Indemnity">
            <p>
                You agree to indemnify and hold harmless {SITE_NAME} and its operators from any
                claim or demand, including reasonable legal fees, arising out of your breach of
                these terms, your misuse of the service, or your violation of any law or the rights
                of a third party.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="changes" title="12. Changes to these terms">
            <p>
                We may update these terms and will update the effective date above when we do.
                Continuing to use the service after a change means you accept the revised terms.
                If you do not accept them, stop using the service and delete your account.
            </p>
        </LegalSection>

        <LegalSection darkMode={darkMode} id="misc" title="13. Everything else">
            <p>
                If any provision of these terms is found unenforceable, the rest stays in effect.
                Our failure to enforce a provision is not a waiver of it. These terms, together
                with the Privacy Policy, are the entire agreement between you and us about the
                service.
            </p>
            <p>
                Read our{' '}
                <Link to="/privacy" className="font-semibold text-emerald-500 hover:text-emerald-400">
                    Privacy Policy
                </Link>.
            </p>
        </LegalSection>
    </LegalPage>
);

export default TermsOfService;
