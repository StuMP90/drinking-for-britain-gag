import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import PasskeysManager from './Partials/PasskeysManager';

export default function Edit({
    auth,
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AppLayout title="Profile">
            <Head title="Profile" />

            <div className="space-y-6">
                <div className="bg-[#1a1a24] p-4 sm:p-8 rounded-lg border border-stone-800">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="bg-[#1a1a24] p-4 sm:p-8 rounded-lg border border-stone-800">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="bg-[#1a1a24] p-4 sm:p-8 rounded-lg border border-stone-800">
                    <PasskeysManager className="max-w-xl" />
                </div>

                {!auth.user.is_admin && (
                    <div className="bg-[#1a1a24] p-4 sm:p-8 rounded-lg border border-stone-800">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
