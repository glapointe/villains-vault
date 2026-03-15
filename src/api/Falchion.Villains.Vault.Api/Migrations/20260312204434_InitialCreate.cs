using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Falchion.Villains.Vault.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubjectId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsAdmin = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommunityEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Link = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Comments = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityEvents_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TrackShackUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SubmittedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    EventSeries = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Events_Users_SubmittedByUserId",
                        column: x => x.SubmittedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NotificationPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    RaceResults = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    DlsDeclarations = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CommunityEvents = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationPreferences_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PushTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    Platform = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PushTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PushTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommunityRaces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommunityEventId = table.Column<int>(type: "int", nullable: false),
                    RaceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Distance = table.Column<decimal>(type: "decimal(8,3)", precision: 8, scale: 3, nullable: false),
                    IsKilometers = table.Column<bool>(type: "bit", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    HasVirtualOption = table.Column<bool>(type: "bit", nullable: false),
                    IsPartOfChallenge = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityRaces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityRaces_CommunityEvents_CommunityEventId",
                        column: x => x.CommunityEventId,
                        principalTable: "CommunityEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Races",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventId = table.Column<int>(type: "int", nullable: false),
                    TrackShackUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RaceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Distance = table.Column<int>(type: "int", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", maxLength: 2147483647, nullable: true),
                    MetadataJson = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "{}"),
                    WeatherDataJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StatisticsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    EventSeries = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Races", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Races_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommunityParticipations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommunityRaceId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    IsDls = table.Column<bool>(type: "bit", nullable: false),
                    IsChallenge = table.Column<bool>(type: "bit", nullable: false),
                    IsVirtual = table.Column<bool>(type: "bit", nullable: false),
                    IsSpectator = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityParticipations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityParticipations_CommunityRaces_CommunityRaceId",
                        column: x => x.CommunityRaceId,
                        principalTable: "CommunityRaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityParticipations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Divisions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RaceId = table.Column<int>(type: "int", nullable: false),
                    DivisionValue = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    DivisionLabel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Divisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Divisions_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DlsRaces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RaceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RaceId = table.Column<int>(type: "int", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DlsRaces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DlsRaces_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DlsRaces_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Jobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RaceId = table.Column<int>(type: "int", nullable: false),
                    JobType = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ProgressDataJson = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "{}"),
                    SubmittedByUserId = table.Column<int>(type: "int", nullable: false),
                    CancellationRequested = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Jobs_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Jobs_Users_SubmittedByUserId",
                        column: x => x.SubmittedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RaceResults",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RaceId = table.Column<int>(type: "int", nullable: false),
                    DivisionId = table.Column<int>(type: "int", nullable: false),
                    BibNumber = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Age = table.Column<int>(type: "int", nullable: false),
                    Gender = table.Column<int>(type: "int", nullable: false),
                    RunnerType = table.Column<int>(type: "int", nullable: false),
                    DivisionPlace = table.Column<int>(type: "int", nullable: true),
                    OverallPlace = table.Column<int>(type: "int", nullable: true),
                    GenderPlace = table.Column<int>(type: "int", nullable: true),
                    NetTime = table.Column<TimeSpan>(type: "time", nullable: true),
                    ClockTime = table.Column<TimeSpan>(type: "time", nullable: true),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: true),
                    OverallPace = table.Column<TimeSpan>(type: "time", nullable: true),
                    Hometown = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Split1 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Split2 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Split3 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Split4 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Split5 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Split6 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Split7 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Split8 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Split9 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Split10 = table.Column<TimeSpan>(type: "time", nullable: true),
                    Passes = table.Column<int>(type: "int", nullable: true),
                    Passers = table.Column<int>(type: "int", nullable: true),
                    ResultDataJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaceResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RaceResults_Divisions_DivisionId",
                        column: x => x.DivisionId,
                        principalTable: "Divisions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RaceResults_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DlsDeclarations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DlsRaceId = table.Column<int>(type: "int", nullable: false),
                    BibNumber = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    IsFirstDls = table.Column<bool>(type: "bit", nullable: false),
                    IsGoingForKills = table.Column<bool>(type: "bit", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DlsDeclarations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DlsDeclarations_DlsRaces_DlsRaceId",
                        column: x => x.DlsRaceId,
                        principalTable: "DlsRaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DlsDeclarations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RaceResultFollows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    RaceResultId = table.Column<long>(type: "bigint", nullable: false),
                    FollowType = table.Column<int>(type: "int", nullable: false),
                    DeadLastStarted = table.Column<bool>(type: "bit", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaceResultFollows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RaceResultFollows_RaceResults_RaceResultId",
                        column: x => x.RaceResultId,
                        principalTable: "RaceResults",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RaceResultFollows_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityEvents_CreatedByUserId",
                table: "CommunityEvents",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityParticipations_CommunityRaceId_UserId",
                table: "CommunityParticipations",
                columns: new[] { "CommunityRaceId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityParticipations_UserId",
                table: "CommunityParticipations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityRaces_CommunityEventId",
                table: "CommunityRaces",
                column: "CommunityEventId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityRaces_RaceDate",
                table: "CommunityRaces",
                column: "RaceDate");

            migrationBuilder.CreateIndex(
                name: "IX_Divisions_RaceId_DivisionValue",
                table: "Divisions",
                columns: new[] { "RaceId", "DivisionValue" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DlsDeclarations_DlsRaceId",
                table: "DlsDeclarations",
                column: "DlsRaceId");

            migrationBuilder.CreateIndex(
                name: "IX_DlsDeclarations_DlsRaceId_BibNumber",
                table: "DlsDeclarations",
                columns: new[] { "DlsRaceId", "BibNumber" },
                unique: true,
                filter: "[BibNumber] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DlsDeclarations_DlsRaceId_UserId",
                table: "DlsDeclarations",
                columns: new[] { "DlsRaceId", "UserId" },
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DlsDeclarations_UserId",
                table: "DlsDeclarations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DlsRaces_CreatedByUserId",
                table: "DlsRaces",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DlsRaces_RaceDate",
                table: "DlsRaces",
                column: "RaceDate");

            migrationBuilder.CreateIndex(
                name: "IX_DlsRaces_RaceId",
                table: "DlsRaces",
                column: "RaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_EventSeries",
                table: "Events",
                column: "EventSeries");

            migrationBuilder.CreateIndex(
                name: "IX_Events_SubmittedByUserId",
                table: "Events",
                column: "SubmittedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_TrackShackUrl",
                table: "Events",
                column: "TrackShackUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_CreatedAt",
                table: "Jobs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_RaceId",
                table: "Jobs",
                column: "RaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_Status",
                table: "Jobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_SubmittedByUserId",
                table: "Jobs",
                column: "SubmittedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPreferences_UserId",
                table: "NotificationPreferences",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PushTokens_Token",
                table: "PushTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PushTokens_UserId",
                table: "PushTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResultFollows_RaceResultId",
                table: "RaceResultFollows",
                column: "RaceResultId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResultFollows_UserId",
                table: "RaceResultFollows",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResultFollows_UserId_RaceResultId",
                table: "RaceResultFollows",
                columns: new[] { "UserId", "RaceResultId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_DivisionId",
                table: "RaceResults",
                column: "DivisionId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_Hometown",
                table: "RaceResults",
                column: "Hometown");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_Name",
                table: "RaceResults",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_BibNumber",
                table: "RaceResults",
                columns: new[] { "RaceId", "BibNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_Gender",
                table: "RaceResults",
                columns: new[] { "RaceId", "Gender" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_Hometown",
                table: "RaceResults",
                columns: new[] { "RaceId", "Hometown" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_Name_Age",
                table: "RaceResults",
                columns: new[] { "RaceId", "Name", "Age" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_NetTime",
                table: "RaceResults",
                columns: new[] { "RaceId", "NetTime" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_OverallPlace",
                table: "RaceResults",
                columns: new[] { "RaceId", "OverallPlace" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceId_StartTime",
                table: "RaceResults",
                columns: new[] { "RaceId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Races_EventId",
                table: "Races",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_Races_EventSeries",
                table: "Races",
                column: "EventSeries");

            migrationBuilder.CreateIndex(
                name: "IX_Races_RaceDate_Distance",
                table: "Races",
                columns: new[] { "RaceDate", "Distance" });

            migrationBuilder.CreateIndex(
                name: "IX_Races_TrackShackUrl",
                table: "Races",
                column: "TrackShackUrl",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Users_SubjectId",
                table: "Users",
                column: "SubjectId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityParticipations");

            migrationBuilder.DropTable(
                name: "DlsDeclarations");

            migrationBuilder.DropTable(
                name: "Jobs");

            migrationBuilder.DropTable(
                name: "NotificationPreferences");

            migrationBuilder.DropTable(
                name: "PushTokens");

            migrationBuilder.DropTable(
                name: "RaceResultFollows");

            migrationBuilder.DropTable(
                name: "CommunityRaces");

            migrationBuilder.DropTable(
                name: "DlsRaces");

            migrationBuilder.DropTable(
                name: "RaceResults");

            migrationBuilder.DropTable(
                name: "CommunityEvents");

            migrationBuilder.DropTable(
                name: "Divisions");

            migrationBuilder.DropTable(
                name: "Races");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
