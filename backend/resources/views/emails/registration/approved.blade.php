<x-mail::message>
    # Selamat Datang di Mosikola!

    Halo **{{ $registration->contact_person }}**,

    Pendaftaran untuk **{{ $registration->school_name }}** telah berhasil disetujui. Kami sangat senang menyambut Anda di platform Mosikola.

    Berikut adalah informasi kredensial untuk mengakses dashboard pengelolaan sekolah Anda:

    <x-mail::panel>
        **Email:** {{ $registration->email }}

        **Password:** `{{ $password }}`

        **Subdomain:** [{{ $registration->slug }}.mosikola.id](https://{{ $registration->slug }}.mosikola.id)
    </x-mail::panel>

    <x-mail::button :url="$loginUrl" color="primary">
        Akses Dashboard Sekarang
    </x-mail::button>

    **Penting:** Mohon segera ganti password Anda setelah berhasil melakukan login pertama kali untuk menjaga keamanan akun Anda.

    Jika Anda memiliki pertanyaan atau butuh bantuan lebih lanjut, silakan hubungi tim dukungan kami.

    Salam hangat,<br>
    **Tim {{ config('app.name') }}**
</x-mail::message>