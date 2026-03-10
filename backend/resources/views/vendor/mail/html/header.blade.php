@props(['url'])
<tr>
    <td class="header">
        <a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
            @if (trim($slot) === 'Laravel')
            <span style="font-size: 28px; font-weight: 800; color: #18181b; letter-spacing: -0.025em;">Mosikola</span>
            @else
            {!! $slot !!}
            @endif
        </a>
    </td>
</tr>