package com.portfolio.jpa.demo.transaction;

import com.portfolio.jpa.domain.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReadOnlyVsWriteResetService {

    private final MemberRepository memberRepository;

    @Transactional
    public void resetMemberName(long memberId, String targetName) {
        memberRepository.findById(memberId).orElseThrow().renameTo(targetName);
    }

    @Transactional(readOnly = true)
    public String fetchName(long memberId) {
        return memberRepository.findById(memberId).orElseThrow().getName();
    }
}
